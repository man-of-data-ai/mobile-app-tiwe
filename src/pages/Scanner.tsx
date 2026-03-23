import React, { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, Text, Button, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Ionicons } from '@expo/vector-icons';
import UPNG from 'upng-js';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { getModelPath, DownloadProgress } from '../utils/modelManager';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

const facing = "back";
const MODEL_INPUT_SIZE = 380;

async function runInference(uri: string, model: TensorflowModel): Promise<number> {
    const resized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
        { base64: true, format: ImageManipulator.SaveFormat.PNG }
    );

    if (!resized.base64) throw new Error('Failed to get base64 from image');

    const binary = atob(resized.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    const img = UPNG.decode(bytes.buffer);
    const rgba = new Uint8Array(UPNG.toRGBA8(img)[0]);

    const float32 = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);
    for (let i = 0; i < MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; i++) {
        float32[i * 3]     = rgba[i * 4];
        float32[i * 3 + 1] = rgba[i * 4 + 1];
        float32[i * 3 + 2] = rgba[i * 4 + 2];
    }

    const output = model.runSync([float32]);
    const raw = (output[0] as any)[0];

    if (raw >= -1 && raw <= 1) {
        // Already a float32 output
        return raw;
    }

    // INT8 quantized output returned as unsigned byte (0-255).
    // Convert to signed INT8 (-128 to 127) then dequantize to [0, 1].
    const int8Value = raw > 127 ? raw - 256 : raw;
    return (int8Value + 128) / 256;
}

export function Scanner({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const { width } = useWindowDimensions();
    const s = makeStyles(width);

    const cameraRef = useRef<CameraView>(null);
    const modelRef = useRef<TensorflowModel | null>(null);
    const [loading, setLoading] = useState(false);
    const [modelReady, setModelReady] = useState(false);
    const [modelError, setModelError] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

    const loadModel = () => {
        setModelError(null);
        setDownloadProgress(null);
        getModelPath((progress) => setDownloadProgress(progress))
            .then(path => loadTensorflowModel({ url: path }))
            .then(model => {
                modelRef.current = model;
                setModelReady(true);
                setDownloadProgress(null);
            })
            .catch(err => {
                console.error('Failed to load model:', err);
                setModelError('Failed to load model. Check your connection and try again.');
            });
    };

    React.useEffect(() => { loadModel(); }, []);

    const handleCapture = async () => {
        if (!cameraRef.current || !modelRef.current || loading) return;
        setLoading(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ skipProcessing: true });
            if (!photo) throw new Error('Failed to take picture');
            const sigmoid = await runInference(photo.uri, modelRef.current);
            navigation.navigate('Result', { sigmoid, photoUri: photo.uri });
        } catch (err) {
            console.error('Inference error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGallery = async () => {
        if (!modelRef.current || loading) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
        });
        if (result.canceled || !result.assets[0]) return;
        setLoading(true);
        try {
            const uri = result.assets[0].uri;
            const sigmoid = await runInference(uri, modelRef.current);
            navigation.navigate('Result', { sigmoid, photoUri: uri });
        } catch (err) {
            console.error('Inference error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!modelReady) {
        return (
            <View style={s.modelLoadingContainer}>
                {modelError ? (
                    <>
                        <Text style={s.modelErrorTitle}>Something went wrong</Text>
                        <Text style={s.modelErrorMessage}>{modelError}</Text>
                        <TouchableOpacity style={s.retryButton} onPress={loadModel}>
                            <Text style={s.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <ActivityIndicator size="large" color="#09090b" />
                        {downloadProgress ? (
                            <>
                                <Text style={s.modelLoadingTitle}>Downloading model…</Text>
                                <View style={s.progressBarTrack}>
                                    <View style={[s.progressBarFill, { width: `${downloadProgress.percent}%` }]} />
                                </View>
                                <Text style={s.modelLoadingSubtitle}>
                                    {downloadProgress.percent}% — {Math.round(downloadProgress.downloadedBytes / 1024 / 1024)} / {Math.round(downloadProgress.totalBytes / 1024 / 1024)} MB
                                </Text>
                            </>
                        ) : (
                            <Text style={s.modelLoadingTitle}>Loading model…</Text>
                        )}
                    </>
                )}
            </View>
        );
    }

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={[s.permsContainer, { paddingTop: insets.top }]}>
                <Text>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    return <View style={s.container}>
        <CameraView ref={cameraRef} style={s.camera} facing={facing} />
        <View style={s.overlay}>
            <View style={s.overlayTop} />
            <View style={s.overlayMiddle}>
                <View style={s.overlaySide} />
                <View style={s.scanBox}>
                    <View style={[s.corner, s.cornerTL]} />
                    <View style={[s.corner, s.cornerTR]} />
                    <View style={[s.corner, s.cornerBL]} />
                    <View style={[s.corner, s.cornerBR]} />
                </View>
                <View style={s.overlaySide} />
            </View>
            <View style={s.overlayBottom}>
                <View style={s.bottomControls}>
                    <TouchableOpacity style={s.galleryButton} activeOpacity={0.7} onPress={handleGallery} disabled={loading}>
                        <Ionicons name="images-outline" size={28} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.captureButton} activeOpacity={0.7} onPress={handleCapture} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="black" />
                            : <View style={s.captureButtonInner} />
                        }
                    </TouchableOpacity>
                    <View style={s.galleryButton} />
                </View>
            </View>
        </View>
    </View>
}

const makeStyles = (width: number) => {
    const scanBoxSize = width * 0.68;
    const cornerSize = scanBoxSize * 0.12;
    const buttonSize = width * 0.17;
    const buttonInnerSize = buttonSize * 0.76;

    return StyleSheet.create({
        modelLoadingContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: width * 0.08,
            gap: width * 0.04,
        },
        modelLoadingTitle: {
            fontSize: width * 0.045,
            fontWeight: '600',
            color: '#09090b',
        },
        modelLoadingSubtitle: {
            fontSize: width * 0.032,
            color: '#71717a',
        },
        progressBarTrack: {
            width: '100%',
            height: 8,
            backgroundColor: '#e4e4e7',
            borderRadius: 4,
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            backgroundColor: '#09090b',
            borderRadius: 4,
        },
        modelErrorTitle: {
            fontSize: width * 0.05,
            fontWeight: 'bold',
            color: '#09090b',
        },
        modelErrorMessage: {
            fontSize: width * 0.035,
            color: '#71717a',
            textAlign: 'center',
        },
        retryButton: {
            backgroundColor: '#09090b',
            paddingVertical: width * 0.035,
            paddingHorizontal: width * 0.08,
            borderRadius: 8,
            marginTop: width * 0.02,
        },
        retryButtonText: {
            color: 'white',
            fontSize: width * 0.04,
            fontWeight: '600',
        },
        permsContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        container: {
            flex: 1,
            justifyContent: 'center',
        },
        camera: {
            flex: 1,
        },
        overlay: {
            ...StyleSheet.absoluteFillObject,
            flexDirection: 'column',
        },
        overlayTop: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        overlayMiddle: {
            flexDirection: 'row',
            height: scanBoxSize,
        },
        overlaySide: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        scanBox: {
            width: scanBoxSize,
        },
        corner: {
            position: 'absolute',
            width: cornerSize,
            height: cornerSize,
            borderColor: 'white',
            borderWidth: 3,
        },
        cornerTL: {
            top: 0,
            left: 0,
            borderRightWidth: 0,
            borderBottomWidth: 0,
            borderTopLeftRadius: 4,
        },
        cornerTR: {
            top: 0,
            right: 0,
            borderLeftWidth: 0,
            borderBottomWidth: 0,
            borderTopRightRadius: 4,
        },
        cornerBL: {
            bottom: 0,
            left: 0,
            borderRightWidth: 0,
            borderTopWidth: 0,
            borderBottomLeftRadius: 4,
        },
        cornerBR: {
            bottom: 0,
            right: 0,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            borderBottomRightRadius: 4,
        },
        overlayBottom: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        bottomControls: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: width * 0.08,
        },
        galleryButton: {
            width: buttonSize,
            height: buttonSize,
            alignItems: 'center',
            justifyContent: 'center',
        },
        captureButton: {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            borderWidth: 4,
            borderColor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
        },
        captureButtonInner: {
            width: buttonInnerSize,
            height: buttonInnerSize,
            borderRadius: buttonInnerSize / 2,
            backgroundColor: 'white',
        },
    });
}
