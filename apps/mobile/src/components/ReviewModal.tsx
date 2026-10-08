import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ReviewModalProps {
  visible: boolean;
  fileName: string;
  croppedImageUri: string;
  croppedUris?: string[];
  initialOcrText: string;
  engineUsed?: string;
  hasNext?: boolean;
  onApprove: (finalText: string, andGoToNext?: boolean) => Promise<void>;
  onReject: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  fileName,
  croppedImageUri,
  croppedUris,
  initialOcrText,
  engineUsed,
  hasNext,
  onApprove,
  onReject,
}) => {
  const [editedText, setEditedText] = useState(initialOcrText);
  const [isSaving, setIsSaving] = useState(false);

  // Modal her açıldığında ilk metni güncelle
  React.useEffect(() => {
    setEditedText(initialOcrText);
  }, [initialOcrText]);

  const handleApprove = async (andGoToNext = false) => {
    try {
      setIsSaving(true);
      await onApprove(editedText, andGoToNext);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onReject}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Üst Başlık */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>OCR İnceleme & Onay</Text>
          <TouchableOpacity onPress={onReject} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {/* Dosya Adı Bilgisi */}
          <View style={styles.infoCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.infoLabel}>📁 Dosya Adı (Katalog Anahtarı):</Text>
              {engineUsed ? (
                <Text style={{ fontSize: 11, color: '#4ADE80', fontWeight: '600' }}>⚡ {engineUsed}</Text>
              ) : null}
            </View>
            <Text style={styles.fileNameText} selectable>
              {fileName}
            </Text>
          </View>

          {/* Kırpılmış Sütunlar / Gazete Kupürü */}
          <Text style={styles.sectionTitle}>
            ✂️ Kırpılan Gazete {croppedUris && croppedUris.length > 1 ? `Sütunları (${croppedUris.length})` : 'Kupürü'}
          </Text>

          {croppedUris && croppedUris.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {croppedUris.map((uri, idx) => (
                  <View key={idx} style={{ width: 140, alignItems: 'center' }}>
                    <Text style={{ color: '#4ADE80', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                      {`${idx + 1}. Sütun`}
                    </Text>
                    <Image
                      source={{ uri }}
                      style={{ width: 140, height: 180, borderRadius: 8, backgroundColor: '#020617' }}
                      resizeMode="contain"
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.imageCard}>
              <Image source={{ uri: croppedImageUri }} style={styles.croppedImage} resizeMode="contain" />
            </View>
          )}

          {/* OCR Metin İnceleme ve Düzenleme */}
          <View style={styles.textSectionHeader}>
            <Text style={styles.sectionTitle}>📝 Çıkarılan Gazete Metni</Text>
            <Text style={styles.editHint}>(Gerekirse düzenleyebilirsiniz)</Text>
          </View>

          <TextInput
            style={styles.textInput}
            multiline
            value={editedText}
            onChangeText={setEditedText}
            placeholder="OCR metni burada görüntülenecektir..."
            placeholderTextColor="#64748B"
          />

          {/* Kullanıcı Onay Kutusu */}
          <View style={styles.approvalBox}>
            <Text style={styles.questionTitle}>🔍 Bu OCR çıktısı iyi mi?</Text>
            <Text style={styles.questionSubtitle}>
              Onayladığınızda metin <Text style={styles.highlightText}>{fileName}</Text> adıyla
              kataloglanacak ve görsel "Kullanılanlar" listesine alınacaktır.
            </Text>

            <View style={styles.buttonCol}>
              {hasNext && (
                <TouchableOpacity
                  style={styles.approveNextButton}
                  onPress={() => handleApprove(true)}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#0F172A" size="small" />
                  ) : (
                    <Text style={styles.approveNextText}>✅ Onayla & Sonraki Gazeteye Geç ▶</Text>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={onReject}
                  disabled={isSaving}
                >
                  <Text style={styles.rejectText}>❌ Yeniden Kırp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApprove(false)}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.approveText}>💾 {hasNext ? 'Kaydet & Listeye Dön' : '✅ Onayla ve Kaydet'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  fileNameText: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  textSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  editHint: {
    fontSize: 12,
    color: '#64748B',
  },
  imageCard: {
    height: 200,
    backgroundColor: '#020617',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  croppedImage: {
    width: '100%',
    height: '100%',
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 22,
    minHeight: 140,
    maxHeight: 220,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155',
  },
  approvalBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
  },
  questionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  highlightText: {
    color: '#F1F5F9',
    fontWeight: 'bold',
  },
  buttonCol: {
    gap: 10,
    marginTop: 16,
  },
  approveNextButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  approveNextText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#334155',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  approveButton: {
    flex: 1.3,
    paddingVertical: 12,
    backgroundColor: '#0284C7',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
