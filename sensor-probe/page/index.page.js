(function(){
 var currentApp=__$$hmAppManager$$__.currentApp;
 var currentModule=currentApp.current;
 var cleanup=function(){};
 currentModule.module=DeviceRuntimeCore.Page({
 onInit:function(){},
 build:function(){
 var lines=[],pos=0,live=null,running=false,session=0,sensors=[],events=0,samples=0,last='',candidate=null,source='',logLines=[],fileState='Not saved',logger=null,selected=0;
 var names=['ACTIVITY','SPORT','SLEEP','FACT activity','FACT stand','FACT step','API ACTIVITY']; var deep=null,deepArmed=false,previousXYZ=null,changes=0; var readers=[],unknown=[],idPos=0,armed=false;
 try{logger=DeviceRuntimeCore.HmLogger.getLogger('SensorProbe');}catch(e){}
 function log(s){s=String(s).slice(0,600);logLines.push(Date.now()+' '+s);if(logLines.length>600)logLines.shift();try{if(logger)logger.log(s);else console.log(s);}catch(e){}}
 function add(s){s=String(s);log(s);while(s.length>22){lines.push(s.slice(0,22));s=s.slice(22);}lines.push(s);if(lines.length>1200)lines.splice(0,8);}
 function save(){var fd=null;try{
 if(typeof hmFS==='undefined'||typeof hmFS.open!=='function'||typeof hmFS.write!=='function'||typeof hmFS.close!=='function')throw Error('FS unavailable');
 var str=logLines.join('\n')+'\n',buf=new ArrayBuffer(str.length),a=new Uint8Array(buf);for(var i=0;i<str.length;i++){var c=str.charCodeAt(i);a[i]=c<128?c:63;}
 if(typeof hmFS.O_WRONLY!=='number'||typeof hmFS.O_CREAT!=='number'||typeof hmFS.O_TRUNC!=='number')throw Error('FS flags missing');
 fd=hmFS.open('sensor-probe.log',hmFS.O_WRONLY|hmFS.O_CREAT|hmFS.O_TRUNC);if(typeof fd!=='number'||fd<0)throw Error('open '+fd);
 var n=hmFS.write(fd,buf,0,a.length);if(n!==a.length)throw Error('write '+n+'/'+a.length);fileState='Saved '+n+' B';
 }catch(e){fileState='FS error';log(String(e));}finally{if(fd!==null&&fd>=0)try{hmFS.close(fd);}catch(e){fileState='Close error';}}}
 function label(y,h,s,size,color){return hmUI.createWidget(hmUI.widget.TEXT,{x:8,y:y,w:176,h:h,text:s,text_size:size,color:color,align_h:hmUI.align.CENTER_H,text_style:hmUI.text_style.WRAP});}
 label(35,32,'Sensor Probe 1.1',18,0xffffff);
 var header=label(70,30,'Ready',16,0x55ff88),widgets=[];
 for(var i=0;i<8;i++)widgets.push(label(108+i*24,24,'',12,0xffffff));
 function show(h,a){header.setProperty(hmUI.prop.TEXT,h);for(var i=0;i<8;i++)widgets[i].setProperty(hmUI.prop.TEXT,String(a[i]||'').slice(0,22));}
 function render(){var total=Math.max(1,Math.ceil(lines.length/8));pos=Math.max(0,Math.min(pos,total-1));show((pos+1)+'/'+total,lines.slice(pos*8,pos*8+8));}
 function describe(v){try{var s=JSON.stringify(v);return s===undefined?String(v):s.slice(0,400);}catch(e){return '[unserializable]';}}
 function finite(n){return typeof n==='number'&&isFinite(n);}
 function xyz(v,depth,seen){if(!v||typeof v!=='object'||depth<0||seen.indexOf(v)>=0||seen.length>=40)return null;seen.push(v);
 try{var sets=[['x','y','z'],['X','Y','Z'],['accX','accY','accZ'],['accelX','accelY','accelZ']];for(var j=0;j<sets.length;j++){var k=sets[j],a=[v[k[0]],v[k[1]],v[k[2]]];if(a.every(finite))return a;}
 var keys=Object.keys(v);for(var i=0;i<Math.min(keys.length,24);i++){var r=xyz(v[keys[i]],depth-1,seen);if(r)return r;}}catch(e){}return null;}
 function record(n,v){last=describe(v);var a=xyz(v,4,[]);if(a){if(previousXYZ&&a.some(function(v,i){return v!==previousXYZ[i];}))changes++;previousXYZ=a.slice();candidate=a;source=n;}log(n+' '+last);}
 function inspect(root,path,depth,seen){
 if(!root||(typeof root!=='object'&&typeof root!=='function')||depth<0||seen.indexOf(root)>=0||seen.length>=80)return;
 seen.push(root);var keys=[];try{keys=Object.getOwnPropertyNames(root);}catch(e){add(path+' error '+e);return;}
 for(var i=0;i<Math.min(keys.length,100);i++){var k=keys[i],p=path+'.'+k,d;try{d=Object.getOwnPropertyDescriptor(root,k);if(!d)continue;
 if(/accel|gravity|motion|orient|gyro|sensor|event|position|tilt|wrist/i.test(k))add(p+' '+(d.get?'getter':typeof d.value));
 if(d.value&&typeof d.value==='object')inspect(d.value,p,depth-1,seen);
 }catch(e){log(p+' '+e);}}
 }
 function coreInventory(){
 var seen=[],budget=180;
 function walk(o,path,depth){
 if(!o||(typeof o!=='object'&&typeof o!=='function')||depth<0||seen.indexOf(o)>=0||budget<=0)return;
 seen.push(o);var keys;try{keys=Object.getOwnPropertyNames(o);}catch(e){add(path+' error '+e);return;}
 add(path+' keys '+keys.length);
 for(var i=0;i<keys.length&&budget>0;i++){var k=keys[i];if(k==='constructor'||k==='caller'||k==='arguments')continue;budget--;try{
 var d=Object.getOwnPropertyDescriptor(o,k);if(!d)continue;
 var v=d.value,t=d.get||d.set?'accessor':typeof v;
 add(k+': '+t+(t==='number'?' '+v:''));
 if(/accel|gravity|motion|orient|gyro|tilt|position/i.test(k))add('MATCH '+path+'.'+k);
 if(k==='prototype'||(v&&typeof v==='object'))walk(v,path+'.'+k,depth-1);
 }catch(e){add(k+' error '+e);}}
 try{var proto=Object.getPrototypeOf(o);if(proto&&proto!==Object.prototype&&proto!==Function.prototype)walk(proto,path+' proto',depth-1);}catch(e){add('Proto error '+e);}
 }
 ['HmSensorApi','SensorWidgetFactory'].forEach(function(k){try{var d=Object.getOwnPropertyDescriptor(DeviceRuntimeCore,k);if(d&&d.value){add('Core '+k);walk(d.value,k,3);}else add(k+' unavailable');}catch(e){add(k+' error '+e);}});
 add('Core scan done');add('No native calls');add('Budget left '+budget);
 }
 function inventory(){lines=[];pos=0;var seen=[];inspect(DeviceRuntimeCore,'Core',3,seen);inspect(hmSensor,'Sensor',2,seen);inspect(hmSetting,'Setting',2,seen);
 var used=[];try{Object.getOwnPropertyNames(hmSensor.id).forEach(function(k){var v=hmSensor.id[k];if(typeof v==='number'){used.push(v);if(/accel|gravity|motion|orient|gyro|tilt/i.test(k)){names.push(k);add('Named '+k+' '+v);}}});}catch(e){add('IDs '+e);}
 try{Object.getOwnPropertyNames(hmSensor.event).forEach(function(k){add('Event '+k+' '+hmSensor.event[k]);});}catch(e){add('Events '+e);}
 var lo=used.length?Math.min.apply(null,used):10,hi=used.length?Math.max.apply(null,used):30;for(var i=Math.max(0,lo-2);i<=Math.min(127,hi+4);i++)if(used.indexOf(i)<0)unknown.push(i);
 add('Unknown IDs '+unknown.length);coreInventory();save();render();}
 function testId(){if(!unknown.length){add('No unknown IDs');render();return;}var id=unknown[idPos%unknown.length];if(!armed){armed=true;show('Native ID risk',['ID '+id,'Tap ID again','May crash app']);return;}armed=false;idPos++;log('Testing ID '+id);save();try{var o=hmSensor.createSensor(id);add('ID '+id+' '+(o?'object':'null'));if(o){inspect(o,'ID '+id,1,[]);var p=Object.getPrototypeOf(o);if(p)Object.getOwnPropertyNames(p).forEach(function(k){if(k!=='constructor')add('Method '+k);});}}catch(e){add('ID error '+e);}save();pos=Math.floor((lines.length-1)/8);render();}
 function constructorScan(){
 lines=[];pos=0;deepArmed=false;
 function emitSource(fn,name){
 if(typeof fn!=='function')return;
 add(name+' args '+fn.length);
 try{var src=Function.prototype.toString.call(fn);if(src.indexOf('[native code]')>=0){add('Native source hidden');return;}add('Source '+src.length);add(src.slice(0,2400));if(src.length>2400)add('Source truncated');}catch(e){add('Source error '+e);}
 }
 ['HmSensorApi','SensorWidgetFactory'].forEach(function(k){try{var C=DeviceRuntimeCore[k];emitSource(C,k);if(C&&C.prototype){['createSensor','deleteSensor','activity','stand','step'].forEach(function(m){var d=Object.getOwnPropertyDescriptor(C.prototype,m);if(d)emitSource(d.value,m);});}}catch(e){add(k+' '+e);}});
 var seen=[],queue=[{o:currentApp,p:'App',d:0},{o:currentModule,p:'Module',d:0},{o:DeviceRuntimeCore,p:'Core',d:0},{o:hmSensor,p:'hmSensor',d:0}],budget=500;
 while(queue.length&&budget>0&&seen.length<100){var q=queue.shift(),o=q.o;if(!o||(typeof o!=='object'&&typeof o!=='function')||seen.indexOf(o)>=0)continue;seen.push(o);
 try{var ks=Object.getOwnPropertyNames(o);if(q.d===0)add(q.p+' keys '+ks.length);
 for(var i=0;i<ks.length&&budget>0;i++){budget--;var k=ks[i],p=q.p+'.'+k;if(k==='caller'||k==='arguments'||k==='constructor')continue;var d=Object.getOwnPropertyDescriptor(o,k);if(!d)continue;var v=d.value;
 if(q.d===0||/sensor|runtime|context|factory|accel|gyro|motion|gravity|orient|tilt|position|native|widget/i.test(k))add(p+' '+(d.get?'getter':typeof v));
 if(q.d<4&&v&&(typeof v==='object'||typeof v==='function')&&queue.length<200)queue.push({o:v,p:p,d:q.d+1});
 }
 }catch(e){log(q.p+' '+e);}
 }
 add('Objects '+seen.length);add('Budget left '+budget);add('No constructors called');save();render();
 }
 function deepStart(n){
 var factory=n.indexOf('FACT ')===0, key=factory?n.slice(5):'createSensor';
 var C=DeviceRuntimeCore[factory?'SensorWidgetFactory':'HmSensorApi'];
 if(typeof C!=='function')throw Error('Core class missing');
 add('Ctor arity '+C.length); add('Method '+key);
 // Prefer existing instances; never guess constructor arguments.
 var roots=[currentApp,currentModule,DeviceRuntimeCore,hmSensor],seen=[],budget=100;
 function find(o,d){if(!o||(typeof o!=='object'&&typeof o!=='function')||d<0||budget--<=0||seen.indexOf(o)>=0)return null;seen.push(o);
 try{if(o instanceof C)return o;var ks=Object.getOwnPropertyNames(o);for(var i=0;i<Math.min(ks.length,35);i++){var p=Object.getOwnPropertyDescriptor(o,ks[i]);if(p&&p.value&&typeof p.value==='object'){var hit=find(p.value,d-1);if(hit)return hit;}}}catch(e){}return null;}
 var receiver=null;for(var i=0;i<roots.length&&!receiver;i++)receiver=find(roots[i],3);
 if(!receiver&&typeof C[key]==='function')receiver=C;
 if(!receiver&&C.length===0){log('Construct '+n);save();receiver=new C();}
 if(!receiver)throw Error('No instance; arity '+C.length);
 if(typeof receiver[key]!=='function')throw Error('Method missing');
 log('Call '+n+' arity '+receiver[key].length);save();
 if(factory&&receiver[key].length!==0)throw Error('Args required');
 if(!factory&&receiver[key].length!==1)throw Error('API args unknown');
 var o=factory?receiver[key]():receiver[key](hmSensor.id.ACTIVITY);
 deep={receiver:receiver,o:o,factory:factory};
 record(n,o);add('Return '+typeof o);
 if(o){var p=o;for(var j=0;j<3&&p&&p!==Object.prototype;j++){try{Object.getOwnPropertyNames(p).forEach(function(k){var d=Object.getOwnPropertyDescriptor(p,k);if(d)add(k+' '+(d.get?'getter':typeof d.value));});p=Object.getPrototypeOf(p);}catch(e){break;}}}
 return o;
 }
 function deepPoll(n,o){record(n+' object',o);if(!o)return;var keys=['getActivityInfo','getCurrent','getData','getValue','getAcceleration','getOrientation','getGravity'];for(var i=0;i<keys.length;i++){var k=keys[i];try{if(typeof o[k]==='function'&&o[k].length===0)record(n+' '+k,o[k]());}catch(e){log(k+' '+e);}}
 try{if(typeof o.getX==='function'&&typeof o.getY==='function'&&typeof o.getZ==='function'&&o.getX.length===0&&o.getY.length===0&&o.getZ.length===0)record(n+' axes',{x:o.getX(),y:o.getY(),z:o.getZ()});}catch(e){log('axes '+e);}
 }
 function display(){var a=candidate;show('LIVE '+names[selected],[ 'Events: '+events,'Samples: '+samples,a?'XYZ? changes '+changes:'No XYZ yet',a?'X: '+a[0]:last.slice(0,19),a?'Y: '+a[1]:last.slice(19,38),a?'Z: '+a[2]:last.slice(38,57),a?source:fileState,'STOP to save']);}
 function stop(){running=false;session++;if(live!==null){try{timer.stopTimer(live);}catch(e){}live=null;}
 for(var i=0;i<sensors.length;i++){var s=sensors[i];if(s.started){try{s.o.stop();}catch(e){log('stop '+e);}s.started=false;}for(var j=0;j<s.listeners.length;j++){var l=s.listeners[j];try{if(typeof s.o.removeEventListener==='function')s.o.removeEventListener(l.id,l.fn);}catch(e){log('remove '+e);}}s.listeners=[];}
 if(deep){try{log('Deep session ended; native ownership unknown');}catch(e){log('delete '+e);}deep=null;}
 }
 cleanup=function(){if(running){stop();save();}};
 function start(){if(running)return;var mode=names[selected];if(/^(FACT |API )/.test(mode)&&!deepArmed){deepArmed=true;show('Native call risk',[mode,'Tap RUN again','May crash app']);return;}deepArmed=false;previousXYZ=null;changes=0;events=0;samples=0;candidate=null;source='';last='';running=true;var token=++session;var n=names[selected],o;
 try{if(/^(FACT |API )/.test(n)){o=deepStart(n);live=timer.createTimer(100,1000,function(){if(!running||session!==token)return;samples++;deepPoll(n,o);display();if(samples%30===0)save();});display();return;}o=hmSensor.createSensor(hmSensor.id[n]);if(!o)throw Error('null sensor');var s={o:o,started:false,listeners:[]};sensors=[s];
 var en=['CHANGE','DELAY'];try{Object.getOwnPropertyNames(hmSensor.event).forEach(function(k){if(/motion|accel|gravity|orient|gyro|tilt/i.test(k)&&en.indexOf(k)<0)en.push(k);});}catch(e){}for(var j=0;j<en.length;j++){(function(key){try{var id=hmSensor.event[key];if(typeof id!=='number'||typeof o.addEventListener!=='function')return;var fn=function(){if(!running||session!==token)return;events++;var args=[];for(var k=0;k<arguments.length;k++)args.push(arguments[k]);record(n+' '+key,args);display();};var ret=o.addEventListener(id,fn);log('Listener result '+describe(ret));s.listeners.push({id:id,fn:fn});log(n+' registered '+key+' '+id);}catch(e){log(key+' error '+e);}})(en[j]);}
 if(typeof o.start==='function'){try{o.start();s.started=true;log(n+' start returned');}catch(e){log('start error '+e);}}
 function tick(){if(!running||session!==token)return;samples++;try{if(n==='ACTIVITY'&&typeof o.getActivityInfo==='function')record(n+' poll',o.getActivityInfo());else if(n==='SLEEP'&&typeof o.getBasicInfo==='function')record(n+' basic',o.getBasicInfo());else if(n==='SPORT'&&samples===1&&typeof o.getSportRecord==='function')record(n+' record',o.getSportRecord());else if(names.indexOf(n)>=3){var getters=['getCurrent','getData','getValue','getAcceleration','getOrientation','getGravity'];for(var g=0;g<getters.length;g++){var k=getters[g];if(typeof o[k]==='function'){try{record(n+' '+k,o[k]());}catch(e){log(k+' '+e);}}}if(typeof o.getX==='function'&&typeof o.getY==='function'&&typeof o.getZ==='function')record(n+' axes',{x:o.getX(),y:o.getY(),z:o.getZ()});}}catch(e){last=String(e);log('poll error '+e);}display();if(samples%30===0)save();}
 live=timer.createTimer(100,1000,tick);display();
 }catch(e){stop();add('Start error '+e);save();render();}}
 function button(x,y,w,t,f){hmUI.createWidget(hmUI.widget.BUTTON,{x:x,y:y,w:w,h:38,text:t,text_size:16,normal_color:0x225599,press_color:0x448855,click_func:f});}
 button(12,305,80,'PREV',function(){if(!running){pos--;render();}});
 button(100,305,80,'NEXT',function(){if(!running){pos++;render();}});
 button(12,349,80,'SELECT',function(){if(running)return;deepArmed=false;selected=(selected+1)%names.length;show('Selected',[names[selected],'Press START','Test one sensor','at a time',fileState]);});
 button(100,349,80,'RUN/END',function(){if(running){stop();add('Events: '+events);add('Samples: '+samples);add('Last: '+last);if(candidate)add('XYZ? '+candidate.join(','));save();add(fileState);pos=Math.floor((lines.length-1)/8);render();}else start();});
 button(12,393,168,'CTOR SCAN',function(){if(!running)constructorScan();}); constructorScan();
 },onDestroy:function(){cleanup();}
 });
})();