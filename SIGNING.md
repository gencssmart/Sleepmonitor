# Persistent APK signing
Generate a private PKCS12 keystore locally (do not commit it):

```sh
keytool -genkeypair -storetype PKCS12 -keystore sleepmonitor.p12 -alias sleepmonitor -keyalg RSA -keysize 3072 -validity 10000
base64 -w0 sleepmonitor.p12
```
In repository Settings > Secrets and variables > Actions, add SLEEPMONITOR_KEYSTORE_B64 (base64 output) and SLEEPMONITOR_KEYSTORE_PASSWORD (keystore password). Keep an offline backup. Run Build APK again. The workflow imports the key into the ephemeral Android debug keystore. Without secrets it builds with a temporary debug key and emits a warning. Switching to the persistent key requires one final uninstall after exporting data. Never share the key or password in chat or commit them.
