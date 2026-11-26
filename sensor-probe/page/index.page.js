(function(){
 var currentApp=__$$hmAppManager$$__.currentApp;
 var currentModule=currentApp.current;
 var cleanup=function(){};
 currentModule.module=DeviceRuntimeCore.Page({
 onInit:function(){},
 build:function(){
 var lines=[],pos=0,live=null,running=false,session=0,sensors=[],events=0,samples=0,last='',candidate=null,source='',logLines=[],fileState='Not saved',logger=null,selected=0;
 var names=['ACTIVITY','SPORT','SLEEP'];
 try{logger=DeviceRuntimeCore.HmLogger.getLogger('SensorProbe');}catch(e){}
 function log(s){s=String(s).slice(0,600);logLines.push(Date.now()+' '+s);if(logLines.length>120)logLines.shift();try{if(logger)logger.log(s);else console.log(s);}catch(e){}}
 function add(s){s=String(s);log(s);while(s.length>19){lines.push(s.slice(0,19));s=s.slice(19);}lines.push(s);if(lines.length>240)lines.splice(0,8);}
 function save(){var fd=null;try{
 if(typeof hmFS==='undefined'||typeof hmFS.open!=='function'||typeof hmFS.write!=='function'||typeof hmFS.close!=='function')throw Error('FS unavailable');
 var str=logLines.join('\n')+'\n',buf=new ArrayBuffer(str.length),a=new Uint8Array(buf);for(var i=0;i<str.length;i++){var c=str.charCodeAt(i);a[i]=c<128?c:63;}
 if(typeof hmFS.O_WRONLY!=='number'||typeof hmFS.O_CREAT!=='number'||typeof hmFS.O_TRUNC!=='number')throw Error('FS flags missing');
 fd=hmFS.open('sensor-probe.log',hmFS.O_WRONLY|hmFS.O_CREAT|hmFS.O_TRUNC);if(typeof fd!=='number'||fd<0)throw Error('open '+fd);
 var n=hmFS.write(fd,buf,0,a.length);if(n!==a.length)throw Error('write '+n+'/'+a.length);fileState='Saved '+n+' B';
 }catch(e){fileState='FS error';log(String(e));}finally{if(fd!==null&&fd>=0)try{hmFS.close(fd);}catch(e){fileState='Close error';}}}
 function label(y,h,s,size,color){return hmUI.createWidget(hmUI.widget.TEXT,{x:8,y:y,w:176,h:h,text:s,text_size:size,color:color,align_h:hmUI.align.CENTER_H,text_style:hmUI.text_style.WRAP});}
 label(35,32,'Sensor Probe 0.7',18,0xffffff);
 var header=label(70,30,'Ready',16,0x55ff88),widgets=[];
 for(var i=0;i<8;i++)widgets.push(label(108+i*24,24,'',14,0xffffff));
 function show(h,a){header.setProperty(hmUI.prop.TEXT,h);for(var i=0;i<8;i++)widgets[i].setProperty(hmUI.prop.TEXT,String(a[i]||'').slice(0,19));}
 function render(){var total=Math.max(1,Math.ceil(lines.length/8));pos=Math.max(0,Math.min(pos,total-1));show((pos+1)+'/'+total,lines.slice(pos*8,pos*8+8));}
 function describe(v){try{var s=JSON.stringify(v);return s===undefined?String(v):s.slice(0,400);}catch(e){return '[unserializable]';}}
 function finite(n){return typeof n==='number'&&isFinite(n);}
 function xyz(v,depth,seen){if(!v||typeof v!=='object'||depth<0||seen.indexOf(v)>=0||seen.length>=40)return null;seen.push(v);
 try{var sets=[['x','y','z'],['X','Y','Z'],['accX','accY','accZ'],['accelX','accelY','accelZ']];for(var j=0;j<sets.length;j++){var k=sets[j],a=[v[k[0]],v[k[1]],v[k[2]]];if(a.every(finite))return a;}
 var keys=Object.keys(v);for(var i=0;i<Math.min(keys.length,24);i++){var r=xyz(v[keys[i]],depth-1,seen);if(r)return r;}}catch(e){}return null;}
 function record(n,v){last=describe(v);var a=xyz(v,4,[]);if(a){candidate=a;source=n;}log(n+' '+last);}
 function display(){var a=candidate;show('LIVE '+names[selected],[ 'Events: '+events,'Samples: '+samples,a?'XYZ unverified':'No XYZ yet',a?'X: '+a[0]:last.slice(0,19),a?'Y: '+a[1]:last.slice(19,38),a?'Z: '+a[2]:last.slice(38,57),a?source:fileState,'STOP to save']);}
 function stop(){running=false;session++;if(live!==null){try{timer.stopTimer(live);}catch(e){}live=null;}
 for(var i=0;i<sensors.length;i++){var s=sensors[i];if(s.started){try{s.o.stop();}catch(e){log('stop '+e);}s.started=false;}for(var j=0;j<s.listeners.length;j++){var l=s.listeners[j];try{if(typeof s.o.removeEventListener==='function')s.o.removeEventListener(l.id,l.fn);}catch(e){log('remove '+e);}}s.listeners=[];}
 }
 cleanup=function(){if(running){stop();save();}};
 function start(){if(running)return;events=0;samples=0;candidate=null;source='';last='';running=true;var token=++session;var n=names[selected],o;
 try{o=hmSensor.createSensor(hmSensor.id[n]);if(!o)throw Error('null sensor');var s={o:o,started:false,listeners:[]};sensors=[s];
 var en=['CHANGE','DELAY'];for(var j=0;j<en.length;j++){(function(key){try{var id=hmSensor.event[key];if(typeof id!=='number'||typeof o.addEventListener!=='function')return;var fn=function(){if(!running||session!==token)return;events++;var args=[];for(var k=0;k<arguments.length;k++)args.push(arguments[k]);record(n+' '+key,args);display();};o.addEventListener(id,fn);s.listeners.push({id:id,fn:fn});log(n+' registered '+key+' '+id);}catch(e){log(key+' error '+e);}})(en[j]);}
 if(typeof o.start==='function'){try{o.start();s.started=true;log(n+' start returned');}catch(e){log('start error '+e);}}
 function tick(){if(!running||session!==token)return;samples++;try{if(n==='ACTIVITY'&&typeof o.getActivityInfo==='function')record(n+' poll',o.getActivityInfo());else if(n==='SLEEP'&&typeof o.getBasicInfo==='function')record(n+' basic',o.getBasicInfo());else if(n==='SPORT'&&samples===1&&typeof o.getSportRecord==='function')record(n+' record',o.getSportRecord());}catch(e){last=String(e);log('poll error '+e);}display();if(samples%30===0)save();}
 live=timer.createTimer(100,1000,tick);display();
 }catch(e){stop();add('Start error '+e);save();render();}}
 function button(x,y,w,t,f){hmUI.createWidget(hmUI.widget.BUTTON,{x:x,y:y,w:w,h:38,text:t,text_size:16,normal_color:0x225599,press_color:0x448855,click_func:f});}
 button(12,305,80,'PREV',function(){if(!running){pos--;render();}});
 button(100,305,80,'NEXT',function(){if(!running){pos++;render();}});
 button(12,349,80,'SELECT',function(){if(running)return;selected=(selected+1)%names.length;show('Selected',[names[selected],'Press START','Test one sensor','at a time',fileState]);});
 button(100,349,80,'START/STOP',function(){if(running){stop();add('Events: '+events);add('Samples: '+samples);add('Last: '+last);if(candidate)add('XYZ? '+candidate.join(','));save();add(fileState);pos=Math.floor((lines.length-1)/8);render();}else start();});
 add('Select sensor');add('ACTIVITY default');add('START/STOP');add('CHANGE and DELAY');add('XYZ not verified');add('Log on stop');add('Local file only');add('No unknown IDs');render();
 },onDestroy:function(){cleanup();}
 });
})();