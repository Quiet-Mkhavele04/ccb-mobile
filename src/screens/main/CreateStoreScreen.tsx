import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { createBusiness, uploadBusinessBanner } from '../../api/businessesApi';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

type PickedImage = {
  uri: string;
  mimeType: string;
};

export default function CreateStoreScreen() {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [banner, setBanner] = useState<PickedImage | null>(null);
  const [saving, setSaving] = useState(false);

  const chooseBanner = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to choose your store banner.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setBanner({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const save = async () => {
    if (!name.trim() || !category.trim()) {
      Alert.alert('Missing information', 'Enter your store name and category.');
      return;
    }

    setSaving(true);
    try {
      await createBusiness({
        name: name.trim(),
        category: category.trim(),
        bannerColor: '#1A6B4A',
        description: description.trim(),
        address: address.trim(),
        phone: phone.trim(),
      });

      if (banner) {
        await uploadBusinessBanner(banner.uri, banner.mimeType);
      }

      Alert.alert('Store created', 'Your store is ready. You can now add products.', [
        { text: 'Continue', onPress: () => navigation.goBack() },
      ]);
    } catch (caught) {
      Alert.alert(
        'Could not create store',
        caught instanceof Error ? caught.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={25} color={light.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Store</Text>
        <View style={styles.headerSpace} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.bannerPicker} onPress={() => void chooseBanner()}>
            {banner ? (
              <Image source={{ uri: banner.uri }} style={styles.bannerImage} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="storefront-outline" size={42} color={light.primary} />
                <Text style={styles.bannerTitle}>Choose a store banner</Text>
                <Text style={styles.bannerHint}>This picture will appear at the top of your store.</Text>
              </>
            )}
          </Pressable>

          <Field label="Store name" value={name} onChangeText={setName} placeholder="Quiet Tech Store" />
          <Field label="Category" value={category} onChangeText={setCategory} placeholder="Electronics" />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Tell customers about your business"
            multiline
            onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: 420, animated: true }), 200)}
          />
          <Field label="Address" value={address} onChangeText={setAddress} placeholder="Port Elizabeth, Eastern Cape" />
          <Field label="Business phone" value={phone} onChangeText={setPhone} placeholder="+27 82 123 4567" keyboardType="phone-pad" />

          <Pressable
            style={[styles.saveButton, saving && styles.disabledButton]}
            disabled={saving}
            onPress={() => void save()}
          >
            {saving ? (
              <ActivityIndicator color={light.offWhite} />
            ) : (
              <>
                <Ionicons name="storefront" size={20} color={light.offWhite} />
                <Text style={styles.saveText}>Create my store</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, multiline, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={light.textSecondary}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: light.offWhite },
  header: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: light.border,
  },
  headerTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: light.charcoal },
  headerSpace: { width: 25 },
  content: { padding: 20, paddingBottom: 260 },
  bannerPicker: {
    height: 205,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: light.primary,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3EF',
    marginBottom: 22,
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerTitle: { marginTop: 10, fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal },
  bannerHint: { marginTop: 4, paddingHorizontal: 20, textAlign: 'center', fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary },
  field: { marginBottom: 16 },
  label: { marginBottom: 7, fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.card,
    fontFamily: fontFamily.secondary,
    fontSize: fontSize.sm,
    color: light.charcoal,
  },
  multilineInput: { minHeight: 100, paddingTop: 13, textAlignVertical: 'top' },
  saveButton: {
    minHeight: 52,
    marginTop: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: light.primary,
  },
  disabledButton: { opacity: 0.65 },
  saveText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.offWhite },
});
