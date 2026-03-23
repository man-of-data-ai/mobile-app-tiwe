import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function Result({ route, navigation }: Props) {
    const { sigmoid, photoUri } = route.params;
    const { width } = useWindowDimensions();
    const s = makeStyles(width);
    const isHealthy = sigmoid >= 0.5;

    return (
        <View style={s.container}>
            <Text style={s.title}>Inference Result</Text>

            <Image source={{ uri: photoUri }} style={s.photo} resizeMode="cover" />

            <View style={[s.resultBanner, isHealthy ? s.bannerHealthy : s.bannerInfected]}>
                <Text style={s.resultLabel}>{isHealthy ? 'Healthy' : 'CSSVD Infected'}</Text>
                <Text style={s.resultAnswer}>{isHealthy ? 'No' : 'Yes'}</Text>
            </View>

            <View style={s.card}>
                <Text style={s.label}>Raw sigmoid output</Text>
                <Text style={s.value}>{sigmoid}</Text>
            </View>

            <TouchableOpacity style={s.button} onPress={() => navigation.goBack()}>
                <Text style={s.buttonText}>Scan again</Text>
            </TouchableOpacity>
        </View>
    );
}

const makeStyles = (width: number) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: width * 0.06,
    },
    title: {
        fontSize: width * 0.06,
        fontWeight: 'bold',
        marginBottom: width * 0.08,
    },
    photo: {
        width: '100%',
        height: width * 0.6,
        borderRadius: 12,
        marginBottom: width * 0.05,
    },
    resultBanner: {
        width: '100%',
        borderRadius: 12,
        padding: width * 0.06,
        alignItems: 'center',
        marginBottom: width * 0.05,
    },
    bannerHealthy: {
        backgroundColor: '#dcfce7',
    },
    bannerInfected: {
        backgroundColor: '#fee2e2',
    },
    resultLabel: {
        fontSize: width * 0.045,
        fontWeight: '600',
        color: '#09090b',
        marginBottom: width * 0.01,
    },
    resultAnswer: {
        fontSize: width * 0.12,
        fontWeight: 'bold',
        color: '#09090b',
    },
    card: {
        width: '100%',
        backgroundColor: '#f4f4f5',
        borderRadius: 12,
        padding: width * 0.06,
        alignItems: 'center',
        marginBottom: width * 0.08,
    },
    label: {
        fontSize: width * 0.035,
        color: '#71717a',
        marginBottom: width * 0.02,
    },
    value: {
        fontSize: width * 0.08,
        fontWeight: 'bold',
        color: '#09090b',
    },
    button: {
        backgroundColor: '#09090b',
        paddingVertical: width * 0.04,
        paddingHorizontal: width * 0.1,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: width * 0.04,
        fontWeight: '600',
    },
});
