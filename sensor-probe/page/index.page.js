(function(){
 var currentApp=__$$hmAppManager$$__.currentApp;
 var currentModule=currentApp.current;
 var cleanup=function(){};
 currentModule.module=DeviceRuntimeCore.Page({
 onInit:function(){},
 build:function(){
 var lines=[],pos=0,logger=null,live=null,active=null,count=0,mode=false,readers=[],idx=0,unknown=0,seen=[],raw=[],last='';
 function stop(){if(live!==null){try{timer.stopTimer(live);}catch(e){}live=null;}active=null;mode=false;}
 cleanup=stop;
 function log(s){try{if(logger)logger.log(s);else console.log(s);}catch(e){}}
 function add(s){s=String(s);raw.push(s);log(s);while(s.length>19){lines.push(s.slice(0,19));s=s.slice(19);}lines.push(s);}
 function list(name,obj,values){
 add("["+name+"]");
 if(!obj){add("Not exposed");return;}
 try{
 var keys=Object.getOwnPropertyNames(obj);
 for(var i=0;i<keys.length;i++){
 var k=keys[i],d=Object.getOwnPropertyDescriptor(obj,k);
 if(!d){add(k+" ?");continue;}
 if(!("value" in d)){add(k+" [accessor]");if(values){try{var v=obj[k];if(typeof v==="number")add(k+" = "+v);}catch(e){add("read error");}}continue;}
 var v=d.value,t=typeof v;
 add(k+(values&&(t==="number"||t==="string"||t==="boolean")?" = "+String(v):" : "+t));
 }
 add("Total: "+keys.length);
 }catch(e){add("Error: "+String(e));}
 }
 function label(y,h,s,size,color){return hmUI.createWidget(hmUI.widget.TEXT,{x:8,y:y,w:176,h:h,text:s,text_size:size,color:color,align_h:hmUI.align.CENTER_H,text_style:hmUI.text_style.WRAP});}
 label(35,32,"Sensor Probe 0.6",18,0xffffff);
 var header=label(70,30,"Ready",16,0x55ff88);
 var widgets=[];for(var i=0;i<8;i++)widgets.push(label(108+i*24,24,"",14,0xffffff));
 function render(){var total=Math.max(1,Math.ceil(lines.length/8));header.setProperty(hmUI.prop.TEXT,(pos+1)+"/"+total);for(var i=0;i<8;i++)widgets[i].setProperty(hmUI.prop.TEXT,lines[pos*8+i]||"");}
 function methods(o){var a=[],p=o;for(var d=0;p&&d<3;d++){try{var ks=Object.getOwnPropertyNames(p);for(var j=0;j<ks.length;j++){var k=ks[j],v=Object.getOwnPropertyDescriptor(p,k);if(v&&typeof v.value==="function"&&a.indexOf(k)<0)a.push(k);}p=Object.getPrototypeOf(p);}catch(e){break;}}return a;}
 function describe(v){try{var s=JSON.stringify(v);return s===undefined?String(v):s.slice(0,240);}catch(e){return String(v);}}
 function xyz(v){if(!v||typeof v!=="object")return null;var a=Array.isArray(v)?v:[v.x,v.y,v.z];return a.length===3&&a.every(function(n){return typeof n==="number"&&isFinite(n);})?a:null;}
 function probe(id,name){try{var o=hmSensor.createSensor(id);if(!o){add(name+" null");return;}var m=methods(o);add(name+" methods");add(m.join(" "));var getters=["getData","getValue","read","getAcceleration","getAccelerometer","getXYZ","getOrientation"];for(var j=0;j<getters.length;j++){var k=getters[j];if(m.indexOf(k)>=0){(function(obj,key,n){readers.push({name:n+"."+key,fn:function(){return obj[key]();}});})(o,k,name);add("Reader "+k);}}if(m.indexOf("getX")>=0&&m.indexOf("getY")>=0&&m.indexOf("getZ")>=0)readers.push({name:name+" XYZ",fn:function(){return [o.getX(),o.getY(),o.getZ()];}});if(m.indexOf("addEventListener")>=0||m.indexOf("on")>=0)add(name+" event API found");}catch(e){add(name+" error "+String(e));}}
 function inspect(n,o,d){if(!o||d<0||seen.indexOf(o)>=0||seen.length>=40)return;seen.push(o);try{var ks=Object.getOwnPropertyNames(o);for(var j=0;j<Math.min(ks.length,80);j++){var k=ks[j],v=Object.getOwnPropertyDescriptor(o,k);if(!v||!("value" in v))continue;if(/sensor|accel|gyro|motion|orient|gravity|event|ble|file/i.test(k))add(n+"."+k+" "+typeof v.value);if(d&&v.value&&typeof v.value==="object")inspect(n+"."+k,v.value,d-1);}}catch(e){add(n+" error");}}
 function scan(){stop();lines=[];raw=[];readers=[];seen=[];idx=0;unknown=0;pos=0;try{logger=DeviceRuntimeCore.HmLogger.getLogger("SensorProbe");}catch(e){}add("Targeted scan");var names=["ACTIVITY","SPORT","SLEEP","STEP","ACCELEROMETER","ACCEL","GYROSCOPE","GYRO","MOTION","ORIENTATION"];for(var j=0;j<names.length;j++){var k=names[j];try{if(typeof hmSensor.id[k]==="number")probe(hmSensor.id[k],k);}catch(e){add(String(e));}}inspect("Core",DeviceRuntimeCore,3);list("hmFS",typeof hmFS==="undefined"?null:hmFS,false);list("hmBle",typeof hmBle==="undefined"?null:hmBle,false);add("Readers: "+readers.length);add("ID test: manual");add("No event calls yet");render();}
 function button(x,y,w,t,f){hmUI.createWidget(hmUI.widget.BUTTON,{x:x,y:y,w:w,h:38,text:t,text_size:17,normal_color:0x225599,press_color:0x448855,click_func:f});}
 button(12,305,80,"PREV",function(){if(mode)return;if(pos>0)pos--;render();});
 button(100,305,80,"NEXT",function(){if(mode)return;if((pos+1)*8<lines.length)pos++;render();});
 button(12,349,80,"ID TEST",function(){stop();if(unknown===0){add("Native ID risk");add("Tap again to test 0");unknown=1;}else{var id=unknown-1;if(id===10)id=36;if(id>40){add("ID tests complete");}else{probe(id,"ID "+id);unknown=id+2;add("Readers: "+readers.length);}}pos=Math.floor((lines.length-1)/8);render();});
 button(100,349,80,"LIVE",function(){if(mode){stop();render();return;}if(!readers.length){add("No readers");pos=Math.floor((lines.length-1)/8);render();return;}mode=true;count=0;var r=readers[idx%readers.length];idx++;function sample(){if(!mode)return;try{var v=r.fn(),a=xyz(v);count++;var str=describe(v);var out=[r.name.slice(0,19),a?"XYZ unverified":"Raw result",a?"X: "+a[0]:str.slice(0,19),a?"Y: "+a[1]:str.slice(19,38),a?"Z: "+a[2]:str.slice(38,57),"Samples: "+count,"LIVE stop/next"];header.setProperty(hmUI.prop.TEXT,"LIVE "+idx+"/"+readers.length);for(var i=0;i<8;i++)widgets[i].setProperty(hmUI.prop.TEXT,out[i]||"");if(count%5===1)log(r.name+" "+str);}catch(e){stop();add(r.name+" "+String(e));pos=Math.floor((lines.length-1)/8);render();}}try{live=timer.createTimer(100,500,sample);}catch(e){stop();add(String(e));render();}});
 scan();
 },onDestroy:function(){cleanup();}
 });
})();