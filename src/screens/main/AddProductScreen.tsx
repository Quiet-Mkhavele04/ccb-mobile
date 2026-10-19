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

import { createProduct, uploadProductImage } from '../../api/productsApi';
import { light } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/fonts';

type PickedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

export default function AddProductScreen() {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [saving, setSaving] = useState(false);

  const chooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to choose a product image.');
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
      setImage({
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
      const result = await createProduct({
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        price: amount,
        stockQuantity: quantity,
        isAvailable: quantity > 0,
      });

      if (image) {
        await uploadProductImage(
          result.product.productId,
          image.uri,
          image.mimeType,
          image.fileName
        );
      }

      Alert.alert('Product added', 'Your product is now in your store.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (caught) {
      Alert.alert(
        'Could not add product',
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
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={styles.headerSpace} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.imagePicker} onPress={() => void chooseImage()}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={38} color={light.primary} />
                <Text style={styles.imageTitle}>Add product picture</Text>
                <Text style={styles.imageHint}>JPG, PNG or WEBP · maximum 5 MB</Text>
              </>
            )}
          </Pressable>

          <Field label="Product name" value={name} onChangeText={setName} placeholder="Wireless headphones" />
          <Field label="Category" value={category} onChangeText={setCategory} placeholder="Electronics" />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product"
            multiline
            onFocus={() => {
              setTimeout(() => {
                scrollRef.current?.scrollTo({
                  y: 500,
                  animated: true,
                });
              }, 200);
            }}
          />

          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Field
                label="Price (R)"
                value={price}
                onChangeText={setPrice}
                placeholder="499.99"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.column}>
              <Field
                label="Stock"
                value={stock}
                onChangeText={setStock}
                placeholder="10"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Pressable
            style={[styles.saveButton, saving && styles.disabledButton]}
            disabled={saving}
            onPress={() => void save()}
          >
            {saving ? (
              <ActivityIndicator color={light.offWhite} />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color={light.offWhite} />
                <Text style={styles.saveText}>Add to store</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  multiline,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
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
  imagePicker: {
    height: 210,
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
  preview: { width: '100%', height: '100%' },
  imageTitle: { marginTop: 10, fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: light.charcoal },
  imageHint: { marginTop: 4, fontFamily: fontFamily.secondary, fontSize: fontSize.xs, color: light.textSecondary },
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
