import React from "react";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { View, Text, Button, StyleSheet } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const facing = "back";

export const Scanner = React.memo(function () {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.permsContainer, { paddingTop: insets.top }]}>
                <Text>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    return <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} />
        <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.scanBox}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom} />
        </View>
    </View>
})

const styles = StyleSheet.create({
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
        height: 260,
    },
    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    scanBox: {
        width: 260,
    },
    corner: {
        position: 'absolute',
        width: 32,
        height: 32,
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
    },
})