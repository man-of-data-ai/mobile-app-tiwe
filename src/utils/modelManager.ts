import { documentDirectory, getInfoAsync, createDownloadResumable, deleteAsync } from 'expo-file-system/legacy';

const MODEL_FILENAME = 'cssvd_model_int8.tflite';
const MODEL_LOCAL_PATH = documentDirectory + MODEL_FILENAME;
const MODEL_MIN_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB minimum — rejects corrupt/partial files

const MODEL_DOWNLOAD_URL =
    'https://github.com/man-of-data-ai/mobile-app-tiwe/releases/latest/download/' + MODEL_FILENAME;

export type DownloadProgress = {
    totalBytes: number;
    downloadedBytes: number;
    percent: number;
};

async function isModelValid(): Promise<boolean> {
    const info = await getInfoAsync(MODEL_LOCAL_PATH!) as any;
    return info.exists && info.size >= MODEL_MIN_SIZE_BYTES;
}

async function downloadModel(onProgress?: (progress: DownloadProgress) => void): Promise<string> {
    const downloadResumable = createDownloadResumable(
        MODEL_DOWNLOAD_URL,
        MODEL_LOCAL_PATH!,
        {},
        ({ totalBytesExpectedToWrite, totalBytesWritten }) => {
            onProgress?.({
                totalBytes: totalBytesExpectedToWrite,
                downloadedBytes: totalBytesWritten,
                percent: totalBytesExpectedToWrite > 0
                    ? Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100)
                    : 0,
            });
        }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result?.uri) throw new Error('Model download failed — no URI returned');

    return result.uri;
}

export async function getModelPath(
    onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
    if (await isModelValid()) {
        return MODEL_LOCAL_PATH!;
    }

    // Delete any partial/corrupt file before re-downloading
    await deleteModel();

    return downloadModel(onProgress);
}

export async function deleteModel(): Promise<void> {
    const info = await getInfoAsync(MODEL_LOCAL_PATH!);
    if (info.exists) {
        await deleteAsync(MODEL_LOCAL_PATH!);
    }
}
