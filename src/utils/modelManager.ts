import { documentDirectory, getInfoAsync, createDownloadResumable, deleteAsync } from 'expo-file-system/legacy';

const MODEL_FILENAME = 'cssvd_model_int8.tflite';
const MODEL_LOCAL_PATH = documentDirectory + MODEL_FILENAME;

// Update this URL after uploading to GitHub Releases
const MODEL_DOWNLOAD_URL =
    'https://github.com/man-of-data-ai/mobile-app-tiwe/releases/latest/download/' + MODEL_FILENAME;

export type DownloadProgress = {
    totalBytes: number;
    downloadedBytes: number;
    percent: number;
};

export async function getModelPath(
    onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
    const info = await getInfoAsync(MODEL_LOCAL_PATH!);

    if (info.exists) {
        return MODEL_LOCAL_PATH!;
    }

    const downloadResumable = createDownloadResumable(
        MODEL_DOWNLOAD_URL,
        MODEL_LOCAL_PATH!,
        {},
        (downloadProgressEvent) => {
            const { totalBytesExpectedToWrite, totalBytesWritten } = downloadProgressEvent;
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
    if (!result?.uri) throw new Error('Model download failed');

    return result.uri;
}

export async function deleteModel(): Promise<void> {
    const info = await getInfoAsync(MODEL_LOCAL_PATH!);
    if (info.exists) {
        await deleteAsync(MODEL_LOCAL_PATH!);
    }
}
