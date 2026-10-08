import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CatalogRecordDTO } from '../types';

interface CatalogListModalProps {
  visible: boolean;
  records: CatalogRecordDTO[];
  onClose: () => void;
  onSelectRecord?: (record: CatalogRecordDTO) => void;
}

export const CatalogListModal: React.FC<CatalogListModalProps> = ({
  visible,
  records,
  onClose,
  onSelectRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = records.filter(
    (r) =>
      r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.finalText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Üst Bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📚 Onaylanan Gazete Kataloğu</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Arama Alanı */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Dosya adına veya metne göre ara..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Liste */}
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>Henüz onaylanmış kayıt yok</Text>
            <Text style={styles.emptySubtitle}>
              Kullanılmayan görsellerden birini kırpıp onayladığınızda dosya adıyla burada listelenecektir.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRecords}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => onSelectRecord && onSelectRecord(item)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardFileName} numberOfLines={1}>
                    📄 {item.fileName}
                  </Text>
                  <Text style={styles.cardDate}>
                    {new Date(item.approvedAt).toLocaleDateString('tr-TR')}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  {item.croppedImageUri ? (
                    <Image source={{ uri: item.croppedImageUri }} style={styles.thumbImage} resizeMode="cover" />
                  ) : null}
                  <View style={styles.textWrapper}>
                    <Text style={styles.cardText} numberOfLines={3}>
                      {item.finalText}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.statusBadge}>✓ Onaylandı & Kataloglandı</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#1E293B',
  },
  searchInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
    flex: 1,
    fontFamily: 'monospace',
  },
  cardDate: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  cardBody: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumbImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  textWrapper: {
    flex: 1,
  },
  cardText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4ADE80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
