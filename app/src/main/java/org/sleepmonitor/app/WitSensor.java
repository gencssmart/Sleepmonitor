package org.sleepmonitor.app;
import android.content.*;import android.bluetooth.*;import android.os.*;import java.util.*;
final class WitSensor {
 static final String[] LABELS={"Ruecken","Bauch","Links","Rechts"};
 static final UUID S=uuid("ffe5"),N=uuid("ffe4"),D=uuid("2902");
 static UUID uuid(String s){return UUID.fromString("0000"+s+"-0000-1000-8000-00805f9b34fb");}
 static volatile String status="Bereit"; static volatile Sample sample; static volatile long packets,reconnects;
 static final double[][] refs=new double[4][];
 static class Sample {final long wall,mono;final double[] v;Sample(byte[] b,long w,long m){wall=w;mono=m;v=new double[9];for(int i=0;i<9;i++){int j=2+2*i;v[i]=(short)((b[j]&255)|((b[j+1]&255)<<8))*(i<3?16.0:i<6?2000.0:180.0)/32768.0;}}}
 static boolean fresh(Sample s){return s!=null&&SystemClock.elapsedRealtime()-s.mono<2000;}
 static double norm(double[] v){return Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);}
 static synchronized void load(Context c){for(int i=0;i<4;i++){refs[i]=null;String s=c.getSharedPreferences("wit",0).getString("ref"+i,"");try{String[] a=s.split(";");refs[i]=new double[]{Double.parseDouble(a[0]),Double.parseDouble(a[1]),Double.parseDouble(a[2])};}catch(Exception ignored){}}}
 static synchronized boolean calibrate(Context c,int i){Sample s=sample;if(!fresh(s))return false;double n=norm(s.v);if(n<0.85||n>1.15||Math.abs(s.v[3])+Math.abs(s.v[4])+Math.abs(s.v[5])>10)return false;double[] a={s.v[0]/n,s.v[1]/n,s.v[2]/n};for(int j=0;j<4;j++)if(j!=i&&refs[j]!=null&&dot(a,refs[j])>0.7)return false;refs[i]=a;c.getSharedPreferences("wit",0).edit().putString("ref"+i,a[0]+";"+a[1]+";"+a[2]).apply();return true;}
 static double dot(double[] a,double[] b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
 static synchronized String position(Sample s){if(!fresh(s))return "missing";for(double[] r:refs)if(r==null)return "uncalibrated";double n=norm(s.v);if(n<0.8||n>1.2||Math.abs(s.v[3])+Math.abs(s.v[4])+Math.abs(s.v[5])>15)return "moving";double best=-2,second=-2;int k=0;for(int i=0;i<4;i++){double d=dot(s.v,refs[i])/n;if(d>best){second=best;best=d;k=i;}else if(d>second)second=d;}return best>=0.82&&best-second>=0.15?LABELS[k]:"uncertain";}
 static synchronized String calibration(){int n=0;for(double[] r:refs)if(r!=null)n++;return n+"/4";}
 static synchronized void clear(Context c){Arrays.fill(refs,null);c.getSharedPreferences("wit",0).edit().clear().apply();}
 final Context c;final Handler h;BluetoothGatt g;boolean active;long since;boolean ready;
 WitSensor(Context c,Handler h){this.c=c;this.h=h;}
 void start(){active=true;sample=null;packets=reconnects=0;connect();h.post(watch);}
 void connect(){if(!active||g!=null)return;try{status="Verbinde WIT";since=SystemClock.elapsedRealtime();BluetoothAdapter a=c.getSystemService(BluetoothManager.class).getAdapter();g=a.getRemoteDevice("D7:AC:65:C5:E8:8B").connectGatt(c,false,cb,BluetoothDevice.TRANSPORT_LE);if(g==null)retry();}catch(Exception e){retry();}}
 void retry(){if(!active)return;reconnects++;closeGatt();status="WIT Wiederverbindung";h.removeCallbacks(reconnect);h.postDelayed(reconnect,4000);}
 final Runnable reconnect=()->connect();
 final Runnable watch=new Runnable(){public void run(){if(!active)return;if(g!=null&&SystemClock.elapsedRealtime()-since>15000&&(!ready||!fresh(sample)))retry();h.postDelayed(this,2000);}};
 void closeGatt(){sample=null;ready=false;BluetoothGatt old=g;g=null;if(old!=null)try{old.close();}catch(Exception ignored){}}
 void stop(){active=false;h.removeCallbacks(watch);h.removeCallbacks(reconnect);closeGatt();status="Gestoppt";}
 final BluetoothGattCallback cb=new BluetoothGattCallback(){
 public void onConnectionStateChange(BluetoothGatt x,int s,int state){h.post(()->{if(x!=g||!active)return;try{if(s!=0||state!=BluetoothProfile.STATE_CONNECTED||!x.discoverServices())retry();}catch(Exception e){retry();}});}
 public void onServicesDiscovered(BluetoothGatt x,int s){h.post(()->{if(x!=g||!active)return;try{BluetoothGattService svc=x.getService(S);BluetoothGattCharacteristic n=svc==null?null:svc.getCharacteristic(N);if(s!=0||n==null||!x.setCharacteristicNotification(n,true)){retry();return;}BluetoothGattDescriptor d=n.getDescriptor(D);if(d==null){retry();return;}d.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);if(!x.writeDescriptor(d))retry();}catch(Exception e){retry();}});}
 public void onDescriptorWrite(BluetoothGatt x,BluetoothGattDescriptor d,int s){h.post(()->{if(x!=g||!active)return;if(s!=0){retry();return;}ready=true;since=SystemClock.elapsedRealtime();status="WIT verbunden";});}
 public void onCharacteristicChanged(BluetoothGatt x,BluetoothGattCharacteristic ch){byte[] b=ch.getValue();if(b!=null)accept(x,ch,b.clone());}
 public void onCharacteristicChanged(BluetoothGatt x,BluetoothGattCharacteristic ch,byte[] b){accept(x,ch,b.clone());}
 void accept(BluetoothGatt x,BluetoothGattCharacteristic ch,byte[] b){long w=System.currentTimeMillis(),m=SystemClock.elapsedRealtime();if(!N.equals(ch.getUuid()))return;h.post(()->{if(x!=g||!active||b.length!=20||b[0]!=0x55||b[1]!=0x61)return;sample=new Sample(b,w,m);packets++;status="WIT Daten aktiv";});}
 };
 static String csv(long now){Sample s=sample;if(!fresh(s))return ",,,,,,,,,,,,missing";StringBuilder b=new StringBuilder();b.append(',').append(s.wall).append(',').append(now-s.wall);for(double v:s.v)b.append(',').append(String.format(Locale.US,"%.5f",v));return b.append(',').append(position(s)).toString();}
 static String live(){Sample s=sample;return status+" | Pakete: "+packets+" | Reconnects: "+reconnects+"\nKalibrierung: "+calibration()+(fresh(s)?String.format(Locale.US,"\nXYZ g: %.3f / %.3f / %.3f\nGyro: %.1f / %.1f / %.1f\nWinkel: %.1f / %.1f / %.1f\nLage: %s",s.v[0],s.v[1],s.v[2],s.v[3],s.v[4],s.v[5],s.v[6],s.v[7],s.v[8],position(s)):"\nKeine aktuellen Lagedaten");}
}
