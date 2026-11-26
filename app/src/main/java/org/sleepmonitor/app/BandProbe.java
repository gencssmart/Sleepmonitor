package org.sleepmonitor.app;
import android.bluetooth.*;
import android.content.Context;
import android.os.*;
import java.util.function.Consumer;
@SuppressWarnings("MissingPermission")
final class BandProbe {
 private final Context context;
 private final Consumer<String> log;
 private final Handler handler=new Handler(Looper.getMainLooper());
 private BluetoothGatt gatt;
 private volatile boolean closed;
 BandProbe(Context c,Consumer<String> l){context=c;log=l;}
 void start(String address){
  try {
   BluetoothManager manager=context.getSystemService(BluetoothManager.class);
   BluetoothAdapter adapter=manager.getAdapter();
   if(adapter==null||!adapter.isEnabled()){log.accept("Bluetooth deaktiviert");return;}
   if(!BluetoothAdapter.checkBluetoothAddress(address)){log.accept("Ungültige MAC-Adresse");return;}
   log.accept("Verbinde "+address);
   gatt=adapter.getRemoteDevice(address).connectGatt(context,false,new BluetoothGattCallback(){
    @Override public void onConnectionStateChange(BluetoothGatt g,int status,int state){
     if(closed)return;
     log.accept("GATT Status "+status+", Zustand "+state);
     if(status==BluetoothGatt.GATT_SUCCESS&&state==BluetoothProfile.STATE_CONNECTED){
      if(!g.discoverServices())log.accept("Service-Suche konnte nicht gestartet werden");
     }else if(state==BluetoothProfile.STATE_DISCONNECTED){log.accept("Verbindung getrennt");}
    }
    @Override public void onServicesDiscovered(BluetoothGatt g,int status){
     if(closed)return;
     log.accept("Service-Suche: "+status);
     if(status!=BluetoothGatt.GATT_SUCCESS)return;
     for(BluetoothGattService s:g.getServices()){
      log.accept("Service "+s.getUuid());
      for(BluetoothGattCharacteristic c:s.getCharacteristics()){
       log.accept("  "+c.getUuid()+" Eigenschaften 0x"+Integer.toHexString(c.getProperties()));
      }
     }
     log.accept("Diagnose abgeschlossen. Keine Schreibbefehle gesendet. Authentifizierung und Sensordaten noch nicht implementiert.");
    }
   },BluetoothDevice.TRANSPORT_LE);
   handler.postDelayed(()->{if(!closed){log.accept("Diagnose nach 90 s beendet");close();}},90000);
  }catch(Exception e){log.accept("Fehler: "+e.getClass().getSimpleName());}
 }
 void close(){closed=true;handler.removeCallbacksAndMessages(null);BluetoothGatt g=gatt;gatt=null;if(g!=null){try{g.disconnect();}catch(Exception ignored){}try{g.close();}catch(Exception ignored){}}}
}
