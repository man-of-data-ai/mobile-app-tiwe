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
    }
})