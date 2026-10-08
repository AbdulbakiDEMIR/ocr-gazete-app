import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import Svg, { Circle, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { CropCoordinatesDTO, CropRegionItem, Point } from '../types';

interface CornerCropperProps {
  imageUri: string;
  fileName: string;
  currentIndex?: number;
  totalImages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onCropComplete: (
    primaryCroppedUri: string,
    zones: CropRegionItem[],
    corners: CropCoordinatesDTO
  ) => void;
  onCancel: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PIN_HIT_SIZE = 48;

type Mode = 'DRAW_BOX' | 'ADJUST_CORNERS' | 'PAN';

interface Metrics {
  origW: number;
  origH: number;
  canvasW: number;
  canvasH: number;
  dispW: number;
  dispH: number;
  originX: number;
  originY: number;
  zoomLevel: number;
  panX: number;
  panY: number;
}

export const CornerCropper: React.FC<CornerCropperProps> = ({
  imageUri,
  fileName,
  currentIndex,
  totalImages,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onCropComplete,
  onCancel,
}) => {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const [canvasLayout, setCanvasLayout] = useState<{ width: number; height: number }>({
    width: SCREEN_WIDTH - 20,
    height: 420,
  });

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Kutu seçildi mi durumu
  const [hasActiveBox, setHasActiveBox] = useState<boolean>(false);
  const hasActiveBoxRef = useRef(false);
  hasActiveBoxRef.current = hasActiveBox;

  const [mode, setMode] = useState<Mode>('DRAW_BOX');
  const modeRef = useRef<Mode>('DRAW_BOX');
  modeRef.current = mode;

  // CANLI ÇİZİLEN DİKDÖRTGEN (TUVAL KOORDİNATLARINDA)
  const [liveBox, setLiveBox] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  // Sürükleme başlangıç tuval noktası
  const startCanvasRef = useRef<Point>({ x: 0, y: 0 });

  // Aktif sürüklenen köşe pini ve kutu taşıma durumu
  const [activePinName, setActivePinName] = useState<keyof CropCoordinatesDTO | null>(null);
  const activePinRef = useRef<keyof CropCoordinatesDTO | null>(null);
  const startPinCanvasRef = useRef<Point>({ x: 0, y: 0 });
  const isMovingBoxRef = useRef(false);
  const startBoxCornersRef = useRef<CropCoordinatesDTO>({
    topLeft: { x: 0, y: 0 },
    topRight: { x: 0, y: 0 },
    bottomRight: { x: 0, y: 0 },
    bottomLeft: { x: 0, y: 0 },
  });

  // Pinch-to-zoom referansları
  const isPinchingRef = useRef(false);
  const pinchStartDistRef = useRef(0);
  const pinchStartZoomRef = useRef(1.0);
  const pinchStartPanRef = useRef<Point>({ x: 0, y: 0 });
  const pinchStartMidRef = useRef<Point>({ x: 0, y: 0 });

  // Kaydedilen Sütunlar
  const [zones, setZones] = useState<CropRegionItem[]>([]);

  // Aktif Sütun Köşeleri: DOĞRUDAN ORİJİNAL FOTOĞRAFIN GERÇEK PİKSELLERİ (0..origWidth, 0..origHeight)
  const [imageCorners, setImageCorners] = useState<CropCoordinatesDTO>({
    topLeft: { x: 0, y: 0 },
    topRight: { x: 0, y: 0 },
    bottomRight: { x: 0, y: 0 },
    bottomLeft: { x: 0, y: 0 },
  });
  const imageCornersRef = useRef(imageCorners);
  imageCornersRef.current = imageCorners;

  // HER RENDERDA GÜNCELLENEN CANLI METRİKLER (Bayat Closure / Stale Buglarını %100 Önler)
  const metricsRef = useRef<Metrics>({
    origW: 1200,
    origH: 1600,
    canvasW: SCREEN_WIDTH - 20,
    canvasH: 420,
    dispW: SCREEN_WIDTH - 20,
    dispH: 420,
    originX: 0,
    originY: 0,
    zoomLevel: 1.0,
    panX: 0,
    panY: 0,
  });

  // 1. Orijinal Görsel Boyutları
  const origW = imageSize?.width || 1200;
  const origH = imageSize?.height || 1600;

  // 2. Tuval Boyutları
  const canvasW = canvasLayout.width;
  const canvasH = canvasLayout.height;

  // 3. Ekrana Sığdırma Ölçeği
  const fitScale = Math.min(canvasW / origW, canvasH / origH);
  const baseW = origW * fitScale;
  const baseH = origH * fitScale;

  const dispW = baseW * zoomLevel;
  const dispH = baseH * zoomLevel;

  const originX = (canvasW - dispW) / 2 + panOffset.x;
  const originY = (canvasH - dispH) / 2 + panOffset.y;

  // 4. metricsRef'i HER RENDER'DA GÜNCELLE
  metricsRef.current = {
    origW,
    origH,
    canvasW,
    canvasH,
    dispW,
    dispH,
    originX,
    originY,
    zoomLevel,
    panX: panOffset.x,
    panY: panOffset.y,
  };

  // Yeni görsel yüklendiğinde boyutları al ve durumu sıfırla
  useEffect(() => {
    setHasActiveBox(false);
    setZones([]);
    setLiveBox(null);
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setMode('DRAW_BOX');

    Image.getSize(
      imageUri,
      (w, h) => {
        setImageSize({ width: w, height: h });
      },
      () => {
        setImageSize({ width: 1200, height: 1600 });
      }
    );
  }, [imageUri]);

  // Tuval Noktası -> Orijinal Fotoğraf Pikseli Dönüşümü (%100 Hassas)
  const toImageCoord = (cx: number, cy: number): Point => {
    const m = metricsRef.current;
    if (m.dispW <= 0 || m.dispH <= 0) return { x: 0, y: 0 };

    const normX = (cx - m.originX) / m.dispW;
    const normY = (cy - m.originY) / m.dispH;

    const ix = Math.round(normX * m.origW);
    const iy = Math.round(normY * m.origH);

    return {
      x: Math.max(0, Math.min(m.origW, ix)),
      y: Math.max(0, Math.min(m.origH, iy)),
    };
  };

  // Orijinal Fotoğraf Pikseli -> Tuval Noktası Dönüşümü
  const toCanvasCoord = (ix: number, iy: number): Point => {
    const m = metricsRef.current;
    if (m.origW <= 0 || m.origH <= 0) return { x: 0, y: 0 };

    return {
      x: m.originX + (ix / m.origW) * m.dispW,
      y: m.originY + (iy / m.origH) * m.dispH,
    };
  };

  // Ekranda 4 köşe pini koordinatları
  const screenCorners: CropCoordinatesDTO = {
    topLeft: toCanvasCoord(imageCorners.topLeft.x, imageCorners.topLeft.y),
    topRight: toCanvasCoord(imageCorners.topRight.x, imageCorners.topRight.y),
    bottomRight: toCanvasCoord(imageCorners.bottomRight.x, imageCorners.bottomRight.y),
    bottomLeft: toCanvasCoord(imageCorners.bottomLeft.x, imageCorners.bottomLeft.y),
  };

  // Dokunulan noktanın bir köşe pinine yakın olup olmadığını denetle (Tüm veriler ref üzerinden anlık okunur)
  const findHitPin = (canvasX: number, canvasY: number): keyof CropCoordinatesDTO | null => {
    if (!hasActiveBoxRef.current) return null;

    const m = metricsRef.current;
    if (m.origW <= 0 || m.origH <= 0 || m.dispW <= 0 || m.dispH <= 0) return null;

    const corners = imageCornersRef.current;
    const pins: (keyof CropCoordinatesDTO)[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
    let bestPin: keyof CropCoordinatesDTO | null = null;
    let minD = 52; // 52px geniş dokunma yarıçapı

    for (const key of pins) {
      const pt = corners[key];
      const scX = m.originX + (pt.x / m.origW) * m.dispW;
      const scY = m.originY + (pt.y / m.origH) * m.dispH;
      const dist = Math.hypot(canvasX - scX, canvasY - scY);
      if (dist < minD) {
        minD = dist;
        bestPin = key;
      }
    }
    return bestPin;
  };

  // TEK YETKİLİ, KESİNTİSİZ PANRESPONDER
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;

        // 1. İKİ PARMAK: Pinch-to-zoom başlat
        if (touches.length >= 2) {
          const t1 = touches[0];
          const t2 = touches[1];
          isPinchingRef.current = true;
          pinchStartDistRef.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          pinchStartZoomRef.current = metricsRef.current.zoomLevel;
          pinchStartPanRef.current = { x: metricsRef.current.panX, y: metricsRef.current.panY };
          pinchStartMidRef.current = {
            x: (t1.pageX + t2.pageX) / 2,
            y: (t1.pageY + t2.pageY) / 2,
          };
          activePinRef.current = null;
          isMovingBoxRef.current = false;
          setActivePinName(null);
          setLiveBox(null);
          return;
        }

        // 2. TEK PARMAK:
        isPinchingRef.current = false;
        const touchX = evt.nativeEvent.locationX;
        const touchY = evt.nativeEvent.locationY;

        // A. Köşe pinine dokunuldu mu? (ÖNCELİK 1: 4 Köşeyi serbestçe ayarlama)
        const hitPin = findHitPin(touchX, touchY);
        if (hitPin) {
          activePinRef.current = hitPin;
          const pinImgPt = imageCornersRef.current[hitPin];
          const m = metricsRef.current;
          startPinCanvasRef.current = {
            x: m.originX + (pinImgPt.x / m.origW) * m.dispW,
            y: m.originY + (pinImgPt.y / m.origH) * m.dispH,
          };
          isMovingBoxRef.current = false;
          setActivePinName(hitPin);
          setLiveBox(null);
          return;
        }

        // B. Gezinme modu aktif mi?
        if (modeRef.current === 'PAN' && metricsRef.current.zoomLevel > 1.0) {
          activePinRef.current = null;
          isMovingBoxRef.current = false;
          setActivePinName(null);
          pinchStartPanRef.current = { x: metricsRef.current.panX, y: metricsRef.current.panY };
          pinchStartMidRef.current = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
          setLiveBox(null);
          return;
        }

        // C. Kutu Ayarlama Modu (ADJUST_CORNERS): Kutu içine basıldıysa tüm kutuyu taşı
        if (hasActiveBoxRef.current && modeRef.current === 'ADJUST_CORNERS') {
          const corners = imageCornersRef.current;
          const m = metricsRef.current;
          const scTL = { x: m.originX + (corners.topLeft.x / m.origW) * m.dispW, y: m.originY + (corners.topLeft.y / m.origH) * m.dispH };
          const scTR = { x: m.originX + (corners.topRight.x / m.origW) * m.dispW, y: m.originY + (corners.topRight.y / m.origH) * m.dispH };
          const scBR = { x: m.originX + (corners.bottomRight.x / m.origW) * m.dispW, y: m.originY + (corners.bottomRight.y / m.origH) * m.dispH };
          const scBL = { x: m.originX + (corners.bottomLeft.x / m.origW) * m.dispW, y: m.originY + (corners.bottomLeft.y / m.origH) * m.dispH };

          const minX = Math.min(scTL.x, scTR.x, scBR.x, scBL.x);
          const maxX = Math.max(scTL.x, scTR.x, scBR.x, scBL.x);
          const minY = Math.min(scTL.y, scTR.y, scBR.y, scBL.y);
          const maxY = Math.max(scTL.y, scTR.y, scBR.y, scBL.y);

          // Kutu içine dokunulduysa tüm kutuyu birlikte kaydır
          if (touchX >= minX - 10 && touchX <= maxX + 10 && touchY >= minY - 10 && touchY <= maxY + 10) {
            isMovingBoxRef.current = true;
            activePinRef.current = null;
            setActivePinName(null);
            startBoxCornersRef.current = { ...corners };
            setLiveBox(null);
            return;
          }

          // Kutu dışındaysa kazara kutuyu silmemek için yeni çizim başlatma
          activePinRef.current = null;
          isMovingBoxRef.current = false;
          setActivePinName(null);
          setLiveBox(null);
          return;
        }

        // D. Kutu Çizme Modu (DRAW_BOX veya kutu henüz yok): Çapraz kutu çizimi başlat
        activePinRef.current = null;
        isMovingBoxRef.current = false;
        setActivePinName(null);
        startCanvasRef.current = { x: touchX, y: touchY };
        setLiveBox({
          x1: touchX,
          y1: touchY,
          x2: touchX,
          y2: touchY,
        });
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        // 1. İki parmakla Pinch-to-Zoom
        if (touches.length >= 2) {
          const t1 = touches[0];
          const t2 = touches[1];
          const curDist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);

          if (!isPinchingRef.current) {
            isPinchingRef.current = true;
            pinchStartDistRef.current = curDist;
            pinchStartZoomRef.current = metricsRef.current.zoomLevel;
            pinchStartPanRef.current = { x: metricsRef.current.panX, y: metricsRef.current.panY };
            pinchStartMidRef.current = {
              x: (t1.pageX + t2.pageX) / 2,
              y: (t1.pageY + t2.pageY) / 2,
            };
            setLiveBox(null);
            activePinRef.current = null;
            isMovingBoxRef.current = false;
            setActivePinName(null);
            return;
          }

          if (pinchStartDistRef.current > 0) {
            const factor = curDist / pinchStartDistRef.current;
            const newZoom = Math.min(4.0, Math.max(1.0, pinchStartZoomRef.current * factor));
            setZoomLevel(Number(newZoom.toFixed(2)));

            const curMidX = (t1.pageX + t2.pageX) / 2;
            const curMidY = (t1.pageY + t2.pageY) / 2;
            const deltaMidX = curMidX - pinchStartMidRef.current.x;
            const deltaMidY = curMidY - pinchStartMidRef.current.y;

            if (newZoom > 1.0) {
              setPanOffset({
                x: pinchStartPanRef.current.x + deltaMidX,
                y: pinchStartPanRef.current.y + deltaMidY,
              });
            } else {
              setPanOffset({ x: 0, y: 0 });
            }
          }
          return;
        }

        if (isPinchingRef.current) return;

        // 2. Köşe Pini Taşıma (Hassas piksel güncellemesi)
        if (activePinRef.current) {
          const pinKey = activePinRef.current;
          const curCX = startPinCanvasRef.current.x + gestureState.dx;
          const curCY = startPinCanvasRef.current.y + gestureState.dy;

          const newImgPt = toImageCoord(curCX, curCY);
          setImageCorners((prev) => ({
            ...prev,
            [pinKey]: newImgPt,
          }));
          return;
        }

        // 3. Tüm Kutuyu Taşıma
        if (isMovingBoxRef.current) {
          const start = startBoxCornersRef.current;
          const m = metricsRef.current;
          if (m.dispW > 0 && m.dispH > 0) {
            const deltaImgX = Math.round((gestureState.dx / m.dispW) * m.origW);
            const deltaImgY = Math.round((gestureState.dy / m.dispH) * m.origH);

            const clamp = (val: number, maxVal: number) => Math.max(0, Math.min(maxVal, val));

            setImageCorners({
              topLeft: {
                x: clamp(start.topLeft.x + deltaImgX, m.origW),
                y: clamp(start.topLeft.y + deltaImgY, m.origH),
              },
              topRight: {
                x: clamp(start.topRight.x + deltaImgX, m.origW),
                y: clamp(start.topRight.y + deltaImgY, m.origH),
              },
              bottomRight: {
                x: clamp(start.bottomRight.x + deltaImgX, m.origW),
                y: clamp(start.bottomRight.y + deltaImgY, m.origH),
              },
              bottomLeft: {
                x: clamp(start.bottomLeft.x + deltaImgX, m.origW),
                y: clamp(start.bottomLeft.y + deltaImgY, m.origH),
              },
            });
          }
          return;
        }

        // 4. Tek Parmakla Gezinme (Pan Modu)
        if (modeRef.current === 'PAN' && metricsRef.current.zoomLevel > 1.0) {
          const deltaX = evt.nativeEvent.pageX - pinchStartMidRef.current.x;
          const deltaY = evt.nativeEvent.pageY - pinchStartMidRef.current.y;
          setPanOffset({
            x: pinchStartPanRef.current.x + deltaX,
            y: pinchStartPanRef.current.y + deltaY,
          });
          return;
        }

        // 5. Çapraz Kutu Çizimi: Canlı parmak takibi
        if (modeRef.current === 'DRAW_BOX' || !hasActiveBoxRef.current) {
          const start = startCanvasRef.current;
          const curCX = start.x + gestureState.dx;
          const curCY = start.y + gestureState.dy;

          setLiveBox({
            x1: start.x,
            y1: start.y,
            x2: curCX,
            y2: curCY,
          });
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (isPinchingRef.current) {
          isPinchingRef.current = false;
          return;
        }

        if (activePinRef.current) {
          activePinRef.current = null;
          setActivePinName(null);
          return;
        }

        if (isMovingBoxRef.current) {
          isMovingBoxRef.current = false;
          return;
        }

        // Çapraz kutu tamamlandı: Fotoğrafın orijinal piksel koordinatlarıyla sabitle
        if (modeRef.current === 'DRAW_BOX' || !hasActiveBoxRef.current) {
          const start = startCanvasRef.current;
          const endX = start.x + gestureState.dx;
          const endY = start.y + gestureState.dy;

          const w = Math.abs(endX - start.x);
          const h = Math.abs(endY - start.y);

          // En az 15x15 piksel sürüklendiyse kutuyu oluştur
          if (w > 15 && h > 15 && modeRef.current !== 'PAN') {
            const minCX = Math.min(start.x, endX);
            const maxCX = Math.max(start.x, endX);
            const minCY = Math.min(start.y, endY);
            const maxCY = Math.max(start.y, endY);

            const tl = toImageCoord(minCX, minCY);
            const tr = toImageCoord(maxCX, minCY);
            const br = toImageCoord(maxCX, maxCY);
            const bl = toImageCoord(minCX, maxCY);

            setImageCorners({
              topLeft: tl,
              topRight: tr,
              bottomRight: br,
              bottomLeft: bl,
            });

            setHasActiveBox(true);
            setMode('ADJUST_CORNERS');
          }
        }

        setLiveBox(null);
      },

      onPanResponderTerminate: () => {
        isPinchingRef.current = false;
        activePinRef.current = null;
        isMovingBoxRef.current = false;
        setActivePinName(null);
        setLiveBox(null);
      },
    })
  ).current;

  // Sütunu Kaydet ve Sıradakini Çiz
  const handleAddZone = () => {
    if (!imageSize || !hasActiveBox) {
      Alert.alert('Uyarı', 'Lütfen önce gazete üzerinde çaprazlama sürükleyerek bir sütun alanı belirleyin.');
      return;
    }

    const newOrder = zones.length + 1;
    const newZone: CropRegionItem = {
      id: `zone-${Date.now()}`,
      order: newOrder,
      label: `${newOrder}. Sütun`,
      corners: { ...imageCorners },
    };

    setZones((prev) => [...prev, newZone]);
    setHasActiveBox(false);
    setMode('DRAW_BOX');

    Alert.alert(
      'Sütun Eklendi ✅',
      `${newOrder}. Sütun yeşil renkle sabitlendi. Şimdi sıradaki sütun için sayfaya basıp çaprazlama yeni kutu çizebilirsiniz.`
    );
  };

  // Son Sütunu Sil
  const handleRemoveLastZone = () => {
    if (zones.length === 0) return;
    setZones((prev) => prev.slice(0, prev.length - 1));
  };

  // Tekil bölgeyi kırpma
  const cropSingleRegion = async (cornersImgPx: CropCoordinatesDTO): Promise<string> => {
    if (!imageSize) throw new Error('Görsel boyutu bulunamadı');

    const minX = Math.min(cornersImgPx.topLeft.x, cornersImgPx.bottomLeft.x);
    const maxX = Math.max(cornersImgPx.topRight.x, cornersImgPx.bottomRight.x);
    const minY = Math.min(cornersImgPx.topLeft.y, cornersImgPx.topRight.y);
    const maxY = Math.max(cornersImgPx.bottomLeft.y, cornersImgPx.bottomRight.y);

    const originCropX = Math.max(0, Math.min(imageSize.width - 20, Math.floor(minX)));
    const originCropY = Math.max(0, Math.min(imageSize.height - 20, Math.floor(minY)));
    const cropW = Math.min(imageSize.width - originCropX, Math.max(30, Math.ceil(maxX - minX)));
    const cropH = Math.min(imageSize.height - originCropY, Math.max(30, Math.ceil(maxY - minY)));

    const actions: ImageManipulator.Action[] = [];
    if (rotationDegrees > 0) {
      actions.push({ rotate: rotationDegrees });
    }

    actions.push({
      crop: {
        originX: originCropX,
        originY: originCropY,
        width: cropW,
        height: cropH,
      },
    });

    const res = await ImageManipulator.manipulateAsync(imageUri, actions, {
      compress: 0.90,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return res.uri;
  };

  // OCR Çalıştır
  const handleExecuteCrop = async () => {
    if (!imageSize) return;

    if (!hasActiveBox && zones.length === 0) {
      Alert.alert(
        'Alan Belirlenmedi',
        'Lütfen gazete sayfasına dokunup çaprazlama sürükleyerek taranacak sütunu veya metin alanını belirleyin.'
      );
      return;
    }

    try {
      setIsProcessing(true);

      let finalZones = [...zones];
      if (hasActiveBox) {
        finalZones.push({
          id: `zone-${Date.now()}`,
          order: zones.length + 1,
          label: `${zones.length + 1}. Sütun`,
          corners: { ...imageCorners },
        });
      }

      const processedZones: CropRegionItem[] = [];
      for (const zone of finalZones) {
        const croppedUri = await cropSingleRegion(zone.corners);
        processedZones.push({
          ...zone,
          croppedUri,
        });
      }

      const primaryUri = processedZones[0]?.croppedUri || imageUri;
      onCropComplete(primaryUri, processedZones, imageCorners);
    } catch (err) {
      console.error('Kırpma hatası:', err);
      Alert.alert('Hata', 'Sütunlar kırpılırken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. ÜST NAVİGASYON (Önceki - Sonraki Gazete) */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, !hasPrevious && styles.navBtnDisabled]}
          onPress={onPrevious}
          disabled={!hasPrevious}
          activeOpacity={0.7}
        >
          <Text style={[styles.navBtnText, !hasPrevious && styles.navBtnTextDisabled]}>◀ Önceki</Text>
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={styles.navFileName} numberOfLines={1}>
            {fileName}
          </Text>
          {totalImages !== undefined && currentIndex !== undefined && (
            <Text style={styles.navCounter}>
              {currentIndex + 1} / {totalImages} Gazete
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
          onPress={onNext}
          disabled={!hasNext}
          activeOpacity={0.7}
        >
          <Text style={[styles.navBtnText, !hasNext && styles.navBtnTextDisabled]}>Sonraki ▶</Text>
        </TouchableOpacity>
      </View>

      {/* 2. MOD VE ZOOM KONTROLÜ */}
      <View style={styles.controlBar}>
        <View style={styles.modeGroup}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'DRAW_BOX' && styles.modeBtnActive]}
            onPress={() => setMode('DRAW_BOX')}
          >
            <Text style={[styles.modeBtnText, mode === 'DRAW_BOX' && styles.modeBtnTextActive]}>
              ✏️ Kutu Çiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              mode === 'ADJUST_CORNERS' && styles.modeBtnActive,
              !hasActiveBox && styles.modeBtnDisabled,
            ]}
            onPress={() => {
              if (hasActiveBox) setMode('ADJUST_CORNERS');
            }}
            disabled={!hasActiveBox}
          >
            <Text
              style={[
                styles.modeBtnText,
                mode === 'ADJUST_CORNERS' && styles.modeBtnTextActive,
                !hasActiveBox && styles.modeBtnTextDisabled,
              ]}
            >
              🎯 4 Köşe
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === 'PAN' && styles.modeBtnActive]}
            onPress={() => setMode('PAN')}
          >
            <Text style={[styles.modeBtnText, mode === 'PAN' && styles.modeBtnTextActive]}>
              ✋ Gezin
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.zoomPills}>
          {[1.0, 1.5, 2.0, 3.0].map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[styles.zoomPill, Math.abs(zoomLevel - lvl) < 0.1 && styles.zoomPillActive]}
              onPress={() => {
                setZoomLevel(lvl);
                if (lvl === 1.0) setPanOffset({ x: 0, y: 0 });
              }}
            >
              <Text
                style={[
                  styles.zoomPillText,
                  Math.abs(zoomLevel - lvl) < 0.1 && styles.zoomPillTextActive,
                ]}
              >
                {lvl === 1.0 ? '1x' : `${lvl}x`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Kaydedilen Sütunlar */}
      {zones.length > 0 && (
        <View style={styles.zonesRow}>
          {zones.map((z) => (
            <View key={z.id} style={styles.zoneChip}>
              <Text style={styles.zoneChipText}>✓ {z.label}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.delZoneBtn} onPress={handleRemoveLastZone}>
            <Text style={styles.delZoneText}>↩ Sil</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. DOKUNMATİK TUVAL */}
      <View
        style={styles.canvasWrapper}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setCanvasLayout({ width, height });
          }
        }}
        {...panResponder.panHandlers}
      >
        {imageSize ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Image
              source={{ uri: imageUri }}
              style={{
                position: 'absolute',
                left: originX,
                top: originY,
                width: dispW,
                height: dispH,
                transform: [{ rotate: `${rotationDegrees}deg` }],
              }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <ActivityIndicator size="large" color="#38BDF8" style={StyleSheet.absoluteFill} />
        )}

        {/* SVG Çizim Katmanı */}
        <Svg
          style={StyleSheet.absoluteFill}
          width={canvasLayout.width}
          height={canvasLayout.height}
          pointerEvents="none"
        >
          {/* Kaydedilmiş Sütunlar (Yeşil Çizgiler) */}
          {zones.map((z, idx) => {
            const scTL = toCanvasCoord(z.corners.topLeft.x, z.corners.topLeft.y);
            const scTR = toCanvasCoord(z.corners.topRight.x, z.corners.topRight.y);
            const scBR = toCanvasCoord(z.corners.bottomRight.x, z.corners.bottomRight.y);
            const scBL = toCanvasCoord(z.corners.bottomLeft.x, z.corners.bottomLeft.y);

            return (
              <React.Fragment key={z.id}>
                <Polygon
                  points={`${scTL.x},${scTL.y} ${scTR.x},${scTR.y} ${scBR.x},${scBR.y} ${scBL.x},${scBL.y}`}
                  fill="rgba(74, 222, 128, 0.22)"
                  stroke="#4ADE80"
                  strokeWidth="2"
                  strokeDasharray="4, 4"
                />
                <SvgText
                  x={scTL.x + 6}
                  y={scTL.y + 16}
                  fill="#4ADE80"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {`${idx + 1}. Sütun`}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Anlık Çapraz Sürükleme Dikdörtgeni (Canlı Ekranda Parmak Takibi) */}
          {liveBox && (
            <Rect
              x={Math.min(liveBox.x1, liveBox.x2)}
              y={Math.min(liveBox.y1, liveBox.y2)}
              width={Math.abs(liveBox.x2 - liveBox.x1)}
              height={Math.abs(liveBox.y2 - liveBox.y1)}
              fill="rgba(56, 189, 248, 0.35)"
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeDasharray="6, 4"
            />
          )}

          {/* Aktif Ayarlanan Sütun (Canlı Mavi Çerçeve) */}
          {hasActiveBox && (
            <>
              <Polygon
                points={`${screenCorners.topLeft.x},${screenCorners.topLeft.y} ${screenCorners.topRight.x},${screenCorners.topRight.y} ${screenCorners.bottomRight.x},${screenCorners.bottomRight.y} ${screenCorners.bottomLeft.x},${screenCorners.bottomLeft.y}`}
                fill="rgba(56, 189, 248, 0.25)"
                stroke="#38BDF8"
                strokeWidth="2"
              />
              <Line
                x1={screenCorners.topLeft.x}
                y1={screenCorners.topLeft.y}
                x2={screenCorners.topRight.x}
                y2={screenCorners.topRight.y}
                stroke="#0284C7"
                strokeWidth="3"
              />
              <Line
                x1={screenCorners.topRight.x}
                y1={screenCorners.topRight.y}
                x2={screenCorners.bottomRight.x}
                y2={screenCorners.bottomRight.y}
                stroke="#0284C7"
                strokeWidth="3"
              />
              <Line
                x1={screenCorners.bottomRight.x}
                y1={screenCorners.bottomRight.y}
                x2={screenCorners.bottomLeft.x}
                y2={screenCorners.bottomLeft.y}
                stroke="#0284C7"
                strokeWidth="3"
              />
              <Line
                x1={screenCorners.bottomLeft.x}
                y1={screenCorners.bottomLeft.y}
                x2={screenCorners.topLeft.x}
                y2={screenCorners.topLeft.y}
                stroke="#0284C7"
                strokeWidth="3"
              />
            </>
          )}
        </Svg>

        {/* 4 Köşe Pini (Orijinal pikseller üzerinden anlık gösterilir) */}
        {hasActiveBox && (
          <>
            <View
              pointerEvents="none"
              style={[
                styles.pinWrapper,
                { left: screenCorners.topLeft.x - PIN_HIT_SIZE / 2, top: screenCorners.topLeft.y - PIN_HIT_SIZE / 2 },
              ]}
            >
              <View style={[styles.pinBubble, activePinName === 'topLeft' && styles.pinBubbleActive]}>
                <Text style={styles.pinText}>1</Text>
              </View>
            </View>

            <View
              pointerEvents="none"
              style={[
                styles.pinWrapper,
                { left: screenCorners.topRight.x - PIN_HIT_SIZE / 2, top: screenCorners.topRight.y - PIN_HIT_SIZE / 2 },
              ]}
            >
              <View style={[styles.pinBubble, activePinName === 'topRight' && styles.pinBubbleActive]}>
                <Text style={styles.pinText}>2</Text>
              </View>
            </View>

            <View
              pointerEvents="none"
              style={[
                styles.pinWrapper,
                { left: screenCorners.bottomRight.x - PIN_HIT_SIZE / 2, top: screenCorners.bottomRight.y - PIN_HIT_SIZE / 2 },
              ]}
            >
              <View style={[styles.pinBubble, activePinName === 'bottomRight' && styles.pinBubbleActive]}>
                <Text style={styles.pinText}>3</Text>
              </View>
            </View>

            <View
              pointerEvents="none"
              style={[
                styles.pinWrapper,
                { left: screenCorners.bottomLeft.x - PIN_HIT_SIZE / 2, top: screenCorners.bottomLeft.y - PIN_HIT_SIZE / 2 },
              ]}
            >
              <View style={[styles.pinBubble, activePinName === 'bottomLeft' && styles.pinBubbleActive]}>
                <Text style={styles.pinText}>4</Text>
              </View>
            </View>
          </>
        )}

        {/* Bilgilendirme İpucu */}
        {!hasActiveBox && !liveBox && (
          <View style={styles.hintOverlay} pointerEvents="none">
            <Text style={styles.hintOverlayText}>
              👆 Sayfaya dokunup çaprazlama sürükleyin
            </Text>
            <Text style={styles.hintOverlaySub}>
              ✌️ İki parmakla büyütebilirsiniz
            </Text>
          </View>
        )}
      </View>

      {/* 4. ALT AKSİYONLAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomActionRow}>
          {hasActiveBox && (
            <TouchableOpacity style={styles.addZoneBtn} onPress={handleAddZone} activeOpacity={0.8}>
              <Text style={styles.addZoneText}>➕ Sütunu Kaydet</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.redrawBtn}
            onPress={() => {
              setHasActiveBox(false);
              setMode('DRAW_BOX');
            }}
          >
            <Text style={styles.redrawBtnText}>✏️ Yeniden Çiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rotateBtn}
            onPress={() => setRotationDegrees((r) => (r + 90) % 360)}
          >
            <Text style={styles.rotateText}>🔄 90°</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainActionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isProcessing}>
            <Text style={styles.cancelBtnText}>✕ Listeye Dön</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cropDeskewBtn,
              !hasActiveBox && zones.length === 0 && styles.cropDeskewBtnDisabled,
            ]}
            onPress={handleExecuteCrop}
            disabled={isProcessing}
            activeOpacity={0.85}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.cropDeskewText}>
                🚀 {zones.length > 0 ? `${zones.length + (hasActiveBox ? 1 : 0)} Sütunu OCR Yap` : 'Seçili Alanı OCR Yap'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  // Üst Nav
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  navBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  navBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  navBtnText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 12,
  },
  navBtnTextDisabled: {
    color: '#94A3B8',
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  navFileName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  navCounter: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  // Kontrol Çubuğu
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  modeBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  modeBtnDisabled: {
    opacity: 0.4,
  },
  modeBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modeBtnTextDisabled: {
    color: '#64748B',
  },
  zoomPills: {
    flexDirection: 'row',
    gap: 4,
  },
  zoomPill: {
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  zoomPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  zoomPillText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  zoomPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Kayıtlı Sütunlar
  zonesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  zoneChip: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#059669',
  },
  zoneChipText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '600',
  },
  delZoneBtn: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  delZoneText: {
    color: '#FECACA',
    fontSize: 11,
    fontWeight: '600',
  },
  // Tuval
  canvasWrapper: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
    marginVertical: 4,
  },
  pinWrapper: {
    position: 'absolute',
    width: PIN_HIT_SIZE,
    height: PIN_HIT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pinBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#38BDF8',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  pinBubbleActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#FEF3C7',
    transform: [{ scale: 1.25 }],
  },
  pinText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 13,
  },
  hintOverlay: {
    position: 'absolute',
    top: '38%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
  },
  hintOverlayText: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  hintOverlaySub: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  // Alt Bar
  bottomBar: {
    gap: 6,
    marginTop: 4,
  },
  bottomActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  addZoneBtn: {
    flex: 2,
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addZoneText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  redrawBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redrawBtnText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 12,
  },
  rotateBtn: {
    width: 50,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rotateText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  mainActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 13,
  },
  cropDeskewBtn: {
    flex: 2,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropDeskewBtnDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.6,
  },
  cropDeskewText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
