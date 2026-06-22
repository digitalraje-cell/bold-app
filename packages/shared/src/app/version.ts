export interface AppReleaseInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string[];
  forceUpdate: boolean;
}

export interface AppVersionResponse {
  appVersion: string;
  buildTimestamp: string;
  release: AppReleaseInfo | null;
}
