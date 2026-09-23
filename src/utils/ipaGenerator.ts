import JSZip from 'jszip';
import { getNativeMachoBinary } from './nativeMachoBinary';
import { CODE_RESOURCES_XML } from './codeResourcesData';

export interface IpaInfo {
  bundleId: string;
  appName: string;
  version: string;
  minOS: string;
}

export const DEFAULT_IPA_INFO: IpaInfo = {
  bundleId: 'com.retroarcade.iphone4',
  appName: 'Retina Arcade',
  version: '1.0.0',
  minOS: '4.3',
};

export async function generateClientIpa(info: IpaInfo = DEFAULT_IPA_INFO): Promise<Blob> {
  const zip = new JSZip();

  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
	<string>${info.appName}</string>
	<key>CFBundleExecutable</key>
	<string>RetinaArcade</string>
	<key>CFBundleIconFiles</key>
	<array>
		<string>Icon.png</string>
		<string>Icon@2x.png</string>
		<string>Icon-72.png</string>
		<string>Icon-72@2x.png</string>
		<string>Icon-Small.png</string>
		<string>Icon-Small@2x.png</string>
	</array>
	<key>CFBundleIdentifier</key>
	<string>${info.bundleId}</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>${info.appName}</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>${info.version}</string>
	<key>CFBundleSignature</key>
	<string>????</string>
	<key>CFBundleSupportedPlatforms</key>
	<array>
		<string>iPhoneOS</string>
	</array>
	<key>CFBundleVersion</key>
	<string>${info.version}</string>
	<key>DTPlatformName</key>
	<string>iphoneos</string>
	<key>DTSDKName</key>
	<string>iphoneos6.1</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>MinimumOSVersion</key>
	<string>${info.minOS}</string>
	<key>UIDeviceFamily</key>
	<array>
		<integer>1</integer>
	</array>
	<key>UIPrerenderedIcon</key>
	<true/>
	<key>UIRequiredDeviceCapabilities</key>
	<array>
		<string>armv7</string>
	</array>
	<key>UIStatusBarHidden</key>
	<false/>
	<key>UIStatusBarStyle</key>
	<string>UIStatusBarStyleBlackTranslucent</string>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
	</array>
</dict>
</plist>`;

  const itunesMetadata = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>artistName</key>
	<string>Retina Arcade Studio</string>
	<key>bundleDisplayName</key>
	<string>${info.appName}</string>
	<key>bundleShortVersionString</key>
	<string>${info.version}</string>
	<key>bundleVersion</key>
	<string>${info.version}</string>
	<key>genre</key>
	<string>Games</string>
	<key>genreId</key>
	<integer>6014</integer>
	<key>itemName</key>
	<string>${info.appName}: Blade Fruit, Doodle Leap &amp; Labyrinth</string>
	<key>kind</key>
	<string>software</string>
	<key>playlistArtistName</key>
	<string>Retina Arcade Studio</string>
	<key>playlistName</key>
	<string>${info.appName}</string>
	<key>softwareVersionBundleId</key>
	<string>${info.bundleId}</string>
	<key>softwareVersionExternalIdentifier</key>
	<integer>8429184</integer>
</dict>
</plist>`;

  // Authentic 32-bit Mach-O armv7 executable for Apple A4 Cortex-A8 (iOS 6)
  const machoBytes = getNativeMachoBinary();

  const appFolder = zip.folder('Payload/RetinaArcade.app');
  if (appFolder) {
    appFolder.file('Info.plist', infoPlist);
    appFolder.file('PkgInfo', 'APPL????');
    appFolder.file('RetinaArcade', machoBytes);
    appFolder.file('iTunesMetadata.plist', itunesMetadata);
    appFolder.file('_CodeSignature/CodeResources', CODE_RESOURCES_XML);

    // Fetch existing public icons if available or create inline
    try {
      const res = await fetch('/Icon@2x.png');
      if (res.ok) {
        const blob = await res.blob();
        appFolder.file('Icon@2x.png', blob);
        appFolder.file('Icon.png', blob);
      }
    } catch {}
  }

  zip.file('iTunesMetadata.plist', itunesMetadata);

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/octet-stream' });
}

export function triggerDownload(blob: Blob, filename: string) {
  // Enforce application/octet-stream to prevent browsers from appending .html or mistaking it for HTML
  const ipaBlob = new Blob([blob], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(ipaBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
