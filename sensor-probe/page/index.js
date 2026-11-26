let __$$app$$__ = __$$hmAppManager$$__.currentApp;
let __$$module$$__ = __$$app$$__.current;
__$$module$$__.module = DeviceRuntimeCore.Page({
 onInit() {
  const title = hmUI.createWidget(hmUI.widget.TEXT,{x:8,y:35,w:176,h:45,text:"Sensor Probe 0.1",text_size:19,color:0xffffff,align_h:hmUI.align.CENTER_H});
  const out = hmUI.createWidget(hmUI.widget.TEXT,{x:8,y:85,w:176,h:225,text:"Scanning...",text_size:16,color:0xffffff,text_style:hmUI.text_style.WRAP});
  const show = s => out.setProperty(hmUI.prop.TEXT,s);
  try {
   const ids=hmSensor.id;
   const keys=Object.getOwnPropertyNames(ids);
   const names=keys.concat(["ACCELEROMETER","ACCEL","ACC","GRAVITY","G_SENSOR","GSENSOR"]);
   const found=names.filter((n,i)=>names.indexOf(n)===i && /acc|grav|g_sensor|gsensor/i.test(n) && typeof ids[n]==="number");
   if(!found.length){show("No XYZ sensor ID\nIDs: "+keys.length+"\n"+keys.join(" ").slice(0,160));return;}
   show("Candidates:\n"+found.join("\n")+"\nTap to probe");
   hmUI.createWidget(hmUI.widget.BUTTON,{x:15,y:300,w:162,h:38,text:"Read XYZ",text_size:18,normal_color:0x225533,press_color:0x448855,click_func:()=>{
    try {
     const sensor=hmSensor.createSensor(ids[found[0]]);
     const read=typeof sensor.getCurrent==="function"?"getCurrent":typeof sensor.getXYZ==="function"?"getXYZ":null;
     if(!read){show(found[0]+"\nNo known XYZ method\n"+Object.getOwnPropertyNames(sensor).join(" ").slice(0,120));return;}
     const v=sensor[read]();
     if(v && ["x","y","z"].every(k=>typeof v[k]==="number" && isFinite(v[k])))show(found[0]+"\nX: "+v.x+"\nY: "+v.y+"\nZ: "+v.z+"\nUnits unknown");
     else show(found[0]+"\nNo valid XYZ sample");
    }catch(e){show("Read failed\n"+String(e).slice(0,120));}
   }});
  }catch(e){show("Scan failed\n"+String(e).slice(0,150));}
 },onDestroy(){}
});