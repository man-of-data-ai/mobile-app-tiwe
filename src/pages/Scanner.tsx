import React from "react";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { View, Text, Button, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const facing = "back";

export const Scanner = React.memo(function () {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const { width } = useWindowDimensions();
    const s = makeStyles(width);

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
        <CameraView style={s.camera} facing={facing} />
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
                <TouchableOpacity style={s.captureButton} activeOpacity={0.7} onPress={() => {}}>
                    <View style={s.captureButtonInner} />
                </TouchableOpacity>
            </View>
        </View>
    </View>
})

const makeStyles = (width: number) => {
    const scanBoxSize = width * 0.68;
    const cornerSize = scanBoxSize * 0.12;
    const buttonSize = width * 0.17;
    const buttonInnerSize = buttonSize * 0.76;

    return StyleSheet.create({
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