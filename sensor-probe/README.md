# Sensor Probe 1.2
DEEP SCAN runs incrementally (40 work steps per timer tick), up to 1000 processed objects, depth 8, 16000 properties. Prioritizes Globals and app/module contexts, checks direct prototype identity, reports motion-name matches and numeric ID gaps (not confirmed sensors), runtime version/commit/build date. No speculative constructors or sensor calls during scan. Existing live modes retained. BLE and FS descriptors inspected; phone export remains unverified and is not implemented. Local bounded log may omit older entries. DEEP SCAN cancels an active scan. BIN packaging unchanged.

## 1.3
SELECT cycles ID 8, 9, 36, 37, 38, 39 and existing modes. RUN twice confirms native risk. Persistent sensor-id-last.txt records create attempt and session end; local log records method descriptors, callbacks and zero-argument allowlisted getters. Numeric triples are candidates, not verified acceleration. Deep scan retains BLE descriptor inspection; no phone export. Native crashes cannot be caught reliably.

## 1.4
SELECT cycles to BLE INFO (passive descriptors and arities), FS EXPORT (local log and FS capability inventory only), RESULTS (per-ID results for current app session). RUN opens selected diagnostic. Existing deep scan and live sensor tests retained. No BLE connection or phone transfer implemented; no speculative BLE native calls. Results reset on app restart; log remains bounded. XYZ candidates are not verified acceleration.

## 1.5
BLE CALLBACK and BLE STATUS inspect descriptors only; no native BLE registration or connection. SYSTEM EVENTS inventories runtime and sensor event names. RAW DATA captures bounded byte frames from existing sensor callbacks/polls, not BLE traffic. XYZ DECODER interprets first three signed integers at 8/16/32 bits, both endian orders where applicable; candidates are not verified acceleration. FS READ reads first 2048 bytes of local log. MOTION TEST compares last XYZ candidate across tests. Existing BIN build retained. Native sensor tests still carry crash risk.
