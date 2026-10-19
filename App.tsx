import React, {

  useCallback,

  useEffect,

  useState,

} from 'react';

import {

  ActivityIndicator,

  Alert,

  View,

} from 'react-native';

import { SafeAreaProvider } from

  'react-native-safe-area-context';

import { NavigationContainer } from

  '@react-navigation/native';

import { StatusBar } from

  'expo-status-bar';



import {

  useFonts as useOutfit,

  Outfit_400Regular,

  Outfit_500Medium,

  Outfit_600SemiBold,

  Outfit_700Bold,

} from '@expo-google-fonts/outfit';



import {

  DMSans_400Regular,

  DMSans_500Medium,

} from '@expo-google-fonts/dm-sans';



import WelcomeScreen from

  './src/screens/onboarding/WelcomeScreen';

import LanguageSelectScreen from

  './src/screens/onboarding/LanguageSelectScreen';

import PhoneNumberScreen from

  './src/screens/onboarding/PhoneNumberScreen';

import VerifyNumberScreen from

  './src/screens/onboarding/VerifyNumberScreen';

import ProfileSetupScreen from

  './src/screens/onboarding/ProfileSetupScreen';

import LoginScreen from

  './src/screens/auth/LoginScreen';



import RootNavigator from

  './src/navigation/RootNavigator';



import {

  getProfile,

  initDatabase,

  saveProfile,

} from './src/db/database';



import { light } from

  './src/theme/colors';



import { LanguageProvider } from

  './src/i18n/LanguageContext';



import {

  getAccessToken,

  removeAccessToken,

  saveAccessToken,

} from './src/storage/authStorage';



import {

  ApiRequestError,

  getMyProfile,

} from './src/api/profileApi';



import type {

  VerifyCodeResponse,

} from './src/api/authApi';



import type {

  CompleteProfileResponse,

} from './src/api/profileApi';



type OnboardingStep =

  | 'welcome'

  | 'login'

  | 'language'

  | 'phone'

  | 'verify'

  | 'setup'

  | 'done';



function AppContent() {

  const [dbReady, setDbReady] =

    useState(false);



  const [step, setStep] =

    useState<OnboardingStep>('welcome');



  const [phoneNumber, setPhoneNumber] =

    useState('');



  const [setupToken, setSetupToken] =

    useState('');



  const [fontsLoaded] = useOutfit({

    Outfit_400Regular,

    Outfit_500Medium,

    Outfit_600SemiBold,

    Outfit_700Bold,

    DMSans_400Regular,

    DMSans_500Medium,

  });



  useEffect(() => {

    const prepareApp = async () => {

      try {

        initDatabase();



        const savedToken =

          await getAccessToken();



        if (!savedToken) {

          console.log(

            'No saved login session found.'

          );



          setStep('welcome');

          return;

        }



        try {

          const result =

            await getMyProfile(

              savedToken

            );



          const currentProfile =

            result.user;



          saveProfile({

            name: currentProfile.name,



            username:

              currentProfile.username,



            phone:

              currentProfile.phone,



            avatar_color:

              currentProfile.avatarColor,



            photo_url:

              currentProfile.profilePhotoUrl ??

              null,



            balance:

              currentProfile.balance,



            dark_mode:

              currentProfile.darkMode

                ? 1

                : 0,

          });



          console.log(

            'Current profile loaded:',

            currentProfile

          );



          setStep('done');

        } catch (error) {

          if (

            error instanceof

              ApiRequestError &&

            (error.status === 401 ||

              error.status === 404)

          ) {

            console.log(

              'Saved session is no longer valid.'

            );



            await removeAccessToken();



            setStep('welcome');

            return;

          }



          // A network problem should not

          // immediately log the user out.

          console.error(

            'Unable to refresh profile:',

            error

          );



          setStep('done');

        }

      } catch (error) {

        console.error(

          'Application startup error:',

          error

        );



        setStep('welcome');

      } finally {

        setDbReady(true);

      }

    };



    prepareApp();

  }, []);



  const handleLogout = useCallback(

    async () => {

      try {

        await removeAccessToken();



        setPhoneNumber('');

        setSetupToken('');

        setStep('welcome');



        console.log(

          'User logged out successfully.'

        );

      } catch (error) {

        console.error(

          'Logout failed:',

          error

        );

      }

    },

    []

  );



  const handleGetStarted =

    useCallback(() => {

      setStep('language');

    }, []);



  



  const handleLoginBack =

    useCallback(() => {

      setStep('welcome');

    }, []);



  const handleLanguageBack =

    useCallback(() => {

      setStep('welcome');

    }, []);



  const handleLanguageContinue =

    useCallback(() => {

      // English only for now.

      setStep('phone');

    }, []);



  const handlePhoneBack =

    useCallback(() => {

      setStep('language');

    }, []);



  const handlePhoneContinue =

    useCallback(

      (fullNumber: string) => {

        setPhoneNumber(fullNumber);

        setStep('verify');

      },

      []

    );



  const handleVerifyBack =

    useCallback(() => {

      setStep('phone');

    }, []);



  const handleVerified =

    useCallback(

      async (

        result: VerifyCodeResponse

      ) => {

        // New user:

        // continue to profile setup.

        if (

          result.isNewUser &&

          result.setupToken

        ) {

          setSetupToken(

            result.setupToken

          );



          setStep('setup');

          return;

        }



        // Existing user: save the token, then
        // reload the complete profile from the API.

        if (

          !result.isNewUser &&

          result.token

        ) {

          await saveAccessToken(

            result.token

          );

          try {
            const profileResult =
              await getMyProfile(
                result.token
              );

            const currentProfile =
              profileResult.user;

            saveProfile({
              name:
                currentProfile.name,

              username:
                currentProfile.username,

              phone:
                currentProfile.phone,

              avatar_color:
                currentProfile.avatarColor,

              photo_url:
                currentProfile.profilePhotoUrl ??
                null,

              balance:
                currentProfile.balance,

              dark_mode:
                currentProfile.darkMode
                  ? 1
                  : 0,
            });

            console.log(
              'Existing profile refreshed:',
              currentProfile
            );

            console.log(
              'Profile saved locally:',
              getProfile()
            );

            setStep('done');
            return;
          } catch (error) {
            console.error(
              'Unable to reload existing profile:',
              error
            );

            Alert.alert(
              'Profile not loaded',
              'Your profile could not be loaded. Please try again.'
            );

            return;
          }

        }



        console.error(

          'Unexpected verification response:',

          result

        );

      },

      []

    );



  const handleSetupBack =

    useCallback(() => {

      setStep('verify');

    }, []);



  const handleFinishSetup =

    useCallback(

      async (

        result:

          CompleteProfileResponse

      ) => {

        await saveAccessToken(

          result.token

        );



        saveProfile({

          name: result.user.name,



          username:

            result.user.username,



          phone:

            result.user.phone,



          avatar_color:

            result.user.avatarColor,



          photo_url:

            result.user.profilePhotoUrl ??

            null,



          balance:

            result.user.balance,



          dark_mode:

            result.user.darkMode

              ? 1

              : 0,

        });



        console.log(

          'Registration completed:',

          result.user

        );



        setSetupToken('');

        setStep('done');

      },

      []

    );



  if (!fontsLoaded || !dbReady) {

    return (

      <View

        style={{

          flex: 1,

          alignItems: 'center',

          justifyContent: 'center',

          backgroundColor:

            light.primary,

        }}

      >

        <ActivityIndicator

          color={light.gold}

          size="large"

        />

      </View>

    );

  }



  return (

    <SafeAreaProvider>

      <StatusBar

        style={

          step === 'welcome'

            ? 'light'

            : 'dark'

        }

      />



      {step === 'welcome' && (

        <WelcomeScreen

          onGetStarted={

            handleGetStarted

          }

          

        />

      )}



      {step === 'login' && (

        <LoginScreen

          onBack={handleLoginBack}

          onLoginSuccess={data => {

            console.log(

              'CCB LOGIN SUCCESS:',

              data

            );



            setStep('done');

          }}

        />

      )}



      {step === 'language' && (

        <LanguageSelectScreen

          onBack={

            handleLanguageBack

          }

          onContinue={

            handleLanguageContinue

          }

        />

      )}



      {step === 'phone' && (

        <PhoneNumberScreen

          onBack={handlePhoneBack}

          onContinue={

            handlePhoneContinue

          }

        />

      )}



      {step === 'verify' && (

        <VerifyNumberScreen

          phoneNumber={phoneNumber}

          onBack={handleVerifyBack}

          onVerified={

            handleVerified

          }

        />

      )}



      {step === 'setup' && (

        <ProfileSetupScreen

          phoneNumber={phoneNumber}

          setupToken={setupToken}

          onBack={handleSetupBack}

          onFinish={

            handleFinishSetup

          }

        />

      )}



      {step === 'done' && (

        <NavigationContainer>

          <RootNavigator

            onLogout={handleLogout}

          />

        </NavigationContainer>

      )}

    </SafeAreaProvider>

  );

}



export default function App() {

  return (

    <LanguageProvider>

      <AppContent />

    </LanguageProvider>

  );

}
