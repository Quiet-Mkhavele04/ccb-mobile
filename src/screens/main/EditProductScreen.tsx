import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import {
  deleteProduct,
  getMyProducts,
  updateProduct,
  uploadProductImage,
} from '../../api/productsApi';
import { resolveMediaUrl } from '../../api/mediaUrl';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

type EditRoute = RouteProp<RootStackParamList, 'EditProduct'>;

type PickedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export default function EditProductScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<EditRoute>();
  const scrollRef = useRef<ScrollView>(null);
  const { productId } = route.params;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [available, setAvailable] = useState(true);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getMyProducts();
      const product = result.products.find(item => item.productId === productId);

      if (!product) {
        Alert.alert('Product unavailable', 'This product was not found in your store.', [
          { text: 'Back', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      setName(product.name);
      setDescription(product.description || '');
      setCategory(product.category);
      setPrice(String(product.price));
      setStock(String(product.stockQuantity));
      setAvailable(product.isAvailable);
      setCurrentImage(resolveMediaUrl(product.imageUrl));
    } catch (caught) {
      Alert.alert(
        'Could not load product',
        caught instanceof Error ? caught.message : 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [navigation, productId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const chooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to replace the product image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setNewImage({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `product-${Date.now()}.jpg`,
      });
    }
  };

  const save = async () => {
    const amount = Number(price.replace(',', '.'));
    const quantity = Number(stock);

    if (!name.trim() || !category.trim()) {
      Alert.alert('Missing information', 'Enter the product name and category.');
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert('Invalid price', 'Enter a valid product price.');
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      Alert.alert('Invalid stock', 'Enter a whole stock quantity of zero or more.');
      return;
    }

    setSaving(true);
    try {
      await updateProduct(productId, {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        price: amount,
        stockQuantity: quantity,
        isAvailable: available && quantity > 0,
      });

      if (newImage) {
        await uploadProductImage(
          productId,
          newImage.uri,
          newImage.mimeType,
          newImage.fileName
        );
      }

      Alert.alert('Product updated', 'Your changes have been saved.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (caught) {
      Alert.alert(
        'Could not update product',
        caught instanceof Error ? caught.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete product?',
      'This permanently removes the product and its picture. Products with order history must be hidden instead.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await deleteProduct(productId);
              navigation.goBack();
            } catch (caught) {
              Alert.alert(
                'Could not delete product',
                caught instanceof Error ? caught.message : 'Please try again.'
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={light.primary} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </SafeAreaView>
    );
  }

  const previewImage = newImage?.uri || currentImage;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={25} color={light.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <Pressable onPress={confirmDelete} hitSlop={12} disabled={saving}>
          <Ionicons name="trash-outline" size={22} color={light.danger} />
        </Pressable>
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
          <Pressable style={styles.imagePicker} onPress={() => void chooseImage()}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.preview} resizeMode="cover" />
            ) : (
              <Ionicons name="camera-outline" size={40} color={light.primary} />
            )}
            <View style={styles.changeImageBadge}>
              <Ionicons name="camera" size={15} color={light.offWhite} />
              <Text style={styles.changeImageText}>Replace picture</Text>
            </View>
          </Pressable>

          <Field label="Product name" value={name} onChangeText={setName} />
          <Field label="Category" value={category} onChangeText={setCategory} />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            onFocus={() => {
              setTimeout(() => scrollRef.current?.scrollTo({ y: 500, animated: true }), 200);
            }}
          />

          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Field label="Price (R)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            </View>
            <View style={styles.column}>
              <Field label="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" />
            </View>
          </View>

          <View style={styles.availabilityCard}>
            <View style={styles.availabilityText}>
              <Text style={styles.availabilityTitle}>Visible in marketplace</Text>
              <Text style={styles.availabilityHint}>
                Turn this off to hide the product without deleting it.
              </Text>
            </View>
            <Switch
              value={available}
              onValueChange={setAvailable}
              trackColor={{ false: light.border, true: light.primary }}
              thumbColor={light.offWhite}
            />
          </View>

          <Pressable
            style={[styles.saveButton, saving && styles.disabledButton]}
            disabled={saving}
            onPress={() => void save()}
          >
            {saving ? (
              <ActivityIndicator color={light.offWhite} />
            ) : (
              <Text style={styles.saveText}>Save changes</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: light.offWhite },
  loadingText: { marginTop: 10, fontFamily: fontFamily.secondary, color: light.textSecondary },
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
  content: { padding: 20, paddingBottom: 260 },
  imagePicker: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3EF',
    marginBottom: 22,
  },
  preview: { width: '100%', height: '100%' },
  changeImageBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  changeImageText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: light.offWhite },
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
  twoColumns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1 },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: light.border,
    backgroundColor: light.card,
  },
  availabilityText: { flex: 1, marginRight: 12 },
  availabilityTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal },
  availabilityHint: { marginTop: 3, fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary },
  saveButton: {
    minHeight: 52,
    marginTop: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.primary,
  },
  disabledButton: { opacity: 0.65 },
  saveText: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.offWhite },
});
