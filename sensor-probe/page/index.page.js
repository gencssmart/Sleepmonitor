(function(){
 var currentApp=__$$hmAppManager$$__.currentApp;
 var currentModule=currentApp.current;
 var cleanup=function(){};
 currentModule.module=DeviceRuntimeCore.Page({
 onInit:function(){},
 build:function(){
 var lines=[],pos=0,live=null,running=false,session=0,sensors=[],events=0,samples=0,last='',candidate=null,source='',logLines=[],fileState='Not saved',logger=null,selected=0;
 var names=['ID 8','ID 9','ID 36','ID 37','ID 38','ID 39','ACTIVITY','SPORT','SLEEP','FACT activity','FACT stand','FACT step','API ACTIVITY','BLE INFO','FS EXPORT','RESULTS']; var results={},activeMode='',activeId=null; var deep=null,deepArmed=false,previousXYZ=null,changes=0; var readers=[],unknown=[],idPos=0,armed=false;
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
 label(35,32,'Sensor Probe 1.4',18,0xffffff);
 var header=label(70,30,'Ready',16,0x55ff88),widgets=[];
 for(var i=0;i<8;i++)widgets.push(label(108+i*24,24,'',12,0xffffff));
 function show(h,a){header.setProperty(hmUI.prop.TEXT,h);for(var i=0;i<8;i++)widgets[i].setProperty(hmUI.prop.TEXT,String(a[i]||'').slice(0,22));}
 function render(){var total=Math.max(1,Math.ceil(lines.length/8));pos=Math.max(0,Math.min(pos,total-1));show((pos+1)+'/'+total,lines.slice(pos*8,pos*8+8));}
 function describe(v){try{var s=JSON.stringify(v);return s===undefined?String(v):s.slice(0,400);}catch(e){return '[unserializable]';}}
 function finite(n){return typeof n==='number'&&isFinite(n);}
 function xyz(v,depth,seen){if(!v||typeof v!=='object'||depth<0||seen.indexOf(v)>=0||seen.length>=40)return null;seen.push(v);
 try{if((Array.isArray(v)||(typeof ArrayBuffer.isView==='function'&&ArrayBuffer.isView(v)))&&v.length===3&&finite(v[0])&&finite(v[1])&&finite(v[2]))return [v[0],v[1],v[2]];var sets=[['x','y','z'],['X','Y','Z'],['accX','accY','accZ'],['accelX','accelY','accelZ']];for(var j=0;j<sets.length;j++){var k=sets[j],a=[v[k[0]],v[k[1]],v[k[2]]];if(a.every(finite))return a;}
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
 var scanTimer=null,scanGeneration=0;
 function cancelScan(){scanGeneration++;if(scanTimer!==null){try{timer.stopTimer(scanTimer);}catch(e){}scanTimer=null;}}
 function constructorScan(){
 cancelScan();lines=[];pos=0;deepArmed=false;unknown=[];logLines=[];
 var token=scanGeneration,seen=[],queue=[],hits=[],instances=[],errors=0,props=0,depthCut=0,queueCut=0,active=null;
 var motion=/accel|gyro|motion|gravity|orient|tilt|(^|[._])xyz|wrist/i;
 function value(o,k){try{var d=Object.getOwnPropertyDescriptor(o,k);return d&&d.value;}catch(e){return undefined;}}
 function enqueue(o,p,d){if(!o||(typeof o!=='object'&&typeof o!=='function')||o===Object.prototype||o===Function.prototype||seen.indexOf(o)>=0)return;if(d>8){depthCut++;return;}if(queue.length>=1500){queueCut++;return;}seen.push(o);queue.push({o:o,p:p,d:d});}
 var classes=['HmSensorApi','SensorWidgetFactory'],protos=classes.map(function(k){return value(value(DeviceRuntimeCore,k),'prototype');});
 ['version','commit','buildDate'].forEach(function(k){var v=value(DeviceRuntimeCore,k);add(k+' '+(typeof v==='string'?v:'unavailable'));});
 classes.forEach(function(k){var c=value(DeviceRuntimeCore,k);if(typeof c==='function'){log(k+' arity '+c.length);try{log(k+' '+Function.prototype.toString.call(c));}catch(e){log(String(e));}}});
 var ids=value(hmSensor,'id'),used=[];
 try{Object.getOwnPropertyNames(ids).forEach(function(k){var v=value(ids,k);if(typeof v==='number'){used.push(v);log('ID '+k+' '+v);if(motion.test(k)&&names.indexOf(k)<0)names.push(k);}});}catch(e){errors++;}
 if(used.length)for(var i=Math.max(0,Math.min.apply(null,used)-2);i<=Math.min(127,Math.max.apply(null,used)+4);i++)if(used.indexOf(i)<0)unknown.push(i);
 add('Unknown IDs '+unknown.join(','));
 enqueue(value(DeviceRuntimeCore,'Globals'),'Globals',0);enqueue(value(currentApp,'app'),'App.app',0);enqueue(value(currentApp,'current'),'App.current',0);enqueue(value(currentModule,'module'),'Module.module',0);
 enqueue(currentApp,'App',0);enqueue(currentModule,'Module',0);enqueue(hmSensor,'Sensor',0);enqueue(DeviceRuntimeCore,'Core',0);
 if(typeof hmBle!=='undefined'){enqueue(hmBle,'BLE',0);try{log('BLE keys '+Object.getOwnPropertyNames(hmBle).join(','));}catch(e){errors++;}}
 if(typeof hmBLE!=='undefined')enqueue(hmBLE,'hmBLE',0);if(typeof hmFS!=='undefined')enqueue(hmFS,'FS',0);
 function finish(reason){cancelScan();add('Objects '+processed);add('Properties '+props);add('Motion hits '+hits.length);add('Instances '+instances.length);add('Stop '+reason);add('Depth cuts '+depthCut);add('Queue cuts '+queueCut);add('Errors '+errors);
 hits.slice(0,8).forEach(function(x){add(x);});instances.slice(0,4).forEach(function(x){add(x);});add('No native sensor calls');add('Phone export unverified');save();add(fileState);pos=0;render();}
 var processed=0;
 function tick(){if(token!==scanGeneration)return;try{var steps=0;while(steps++<40&&props<16000){
 if(!active){if(processed>=1000||!queue.length){finish(queue.length?'object limit':'queue empty');return;}var q=queue.shift();processed++;var keys=[];try{keys=Object.getOwnPropertyNames(q.o);var p=Object.getPrototypeOf(q.o);for(var j=0;j<protos.length;j++)if(protos[j]&&p===protos[j]){var hit=classes[j]+' '+q.p;instances.push(hit);log('INSTANCE '+hit);}enqueue(p,q.p+'.proto',q.d+1);}catch(e){errors++;}active={q:q,keys:keys,i:0};}
 if(active.i>=active.keys.length){active=null;continue;}var k=active.keys[active.i++],q=active.q;props++;if(k==='caller'||k==='arguments'||k==='constructor')continue;
 try{var d=Object.getOwnPropertyDescriptor(q.o,k);if(!d)continue;var v=d.value,p=q.p+'.'+k;if(motion.test(k)){var h=p+' '+(d.get?'getter':typeof v);hits.push(h);log('MATCH '+h);}if(q.d===0||/sensor|context|runtime|factory/i.test(k))log(p+' '+typeof v);enqueue(v,p,q.d+1);}catch(e){errors++;}
 }if(props>=16000){finish('property limit');return;}show('Scanning',['Objects '+processed,'Properties '+props,'Pending '+queue.length,'Motion hits '+hits.length,'Instances '+instances.length,'SCAN to cancel']);}catch(e){errors++;finish('error '+e);}}
 try{scanTimer=timer.createTimer(100,50,tick);}catch(e){finish('timer error');}
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
 function journal(id,stage){
 var fd=null;try{var str=String(id)+' '+stage+' '+Date.now(),a=new Uint8Array(str.length);for(var i=0;i<str.length;i++)a[i]=str.charCodeAt(i);
 fd=hmFS.open('sensor-id-last.txt',hmFS.O_WRONLY|hmFS.O_CREAT|hmFS.O_TRUNC);if(fd<0)throw Error('journal open');if(hmFS.write(fd,a.buffer,0,a.length)!==a.length)throw Error('journal write');hmFS.close(fd);fd=null;return true;
 }catch(e){log('Journal '+e);return false;}finally{if(fd!==null&&fd>=0)try{hmFS.close(fd);}catch(e){}}}
 function inventorySensor(o){var p=o,seen=[];for(var j=0;j<4&&p&&p!==Object.prototype;j++){var ks=Object.getOwnPropertyNames(p);for(var i=0;i<ks.length;i++){var k=ks[i];if(k==='constructor'||seen.indexOf(k)>=0)continue;seen.push(k);var d=Object.getOwnPropertyDescriptor(p,k);if(d)add(k+' '+(d.get?'getter':typeof d.value)+(typeof d.value==='function'?' args '+d.value.length:''));}p=Object.getPrototypeOf(p);}}
 function summary(){lines=[];pos=0;names.slice(0,6).forEach(function(n){add(n+' '+(results[n]||'Not tested'));});save();render();}
 function diagnostic(n){
 lines=[];pos=0;log('Diagnostic '+n);
 if(n==='BLE INFO'){
 var roots=[];if(typeof hmBle!=='undefined')roots.push(['hmBle',hmBle]);if(typeof hmBLE!=='undefined')roots.push(['hmBLE',hmBLE]);
 if(!roots.length)add('BLE global missing');
 roots.forEach(function(pair){var o=pair[1],seen=[];for(var j=0;j<3&&o&&o!==Object.prototype;j++){try{Object.getOwnPropertyNames(o).forEach(function(k){if(seen.indexOf(k)>=0||k==='constructor')return;seen.push(k);var d=Object.getOwnPropertyDescriptor(o,k);if(d)add(k+' '+(d.get?'getter':typeof d.value)+(typeof d.value==='function'?' args '+d.value.length:''));});o=Object.getPrototypeOf(o);}catch(e){add('BLE error '+e);break;}}});
 add('No BLE calls made');add('Phone export unverified');
 }else{
 save();add(fileState);add('sensor-probe.log');try{['open','read','write','close','stat','readdir'].forEach(function(k){add('FS '+k+' '+typeof hmFS[k]);});}catch(e){add('FS unavailable');}add('No phone transfer');
 }save();render();}
 function display(){var a=candidate;show('LIVE '+names[selected],[ 'Events: '+events,'Samples: '+samples,a?'XYZ? changes '+changes:'No XYZ yet',a?'X: '+a[0]:last.slice(0,19),a?'Y: '+a[1]:last.slice(19,38),a?'Z: '+a[2]:last.slice(38,57),a?source:fileState,'STOP to save']);}
 function stop(){running=false;session++;if(live!==null){try{timer.stopTimer(live);}catch(e){}live=null;}
 for(var i=0;i<sensors.length;i++){var s=sensors[i];if(s.started){try{s.o.stop();}catch(e){log('stop '+e);}s.started=false;}for(var j=0;j<s.listeners.length;j++){var l=s.listeners[j];try{if(typeof s.o.removeEventListener==='function')s.o.removeEventListener(l.id,l.fn);}catch(e){log('remove '+e);}}s.listeners=[];}sensors=[];
 if(activeId!==null)journal(activeId,'session ended');if(deep){try{log('Deep session ended; native ownership unknown');}catch(e){log('delete '+e);}deep=null;}
 }
 cleanup=function(){cancelScan();if(running){stop();save();}};
 function start(){if(running||scanTimer!==null)return;var mode=names[selected];if(mode==='RESULTS'){summary();return;}if(mode==='BLE INFO'||mode==='FS EXPORT'){diagnostic(mode);return;}lines=[];pos=0;if(/^(FACT |API |ID )/.test(mode)&&!deepArmed){deepArmed=true;show('Native call risk',[mode,'Tap RUN again','May crash app']);return;}deepArmed=false;previousXYZ=null;changes=0;events=0;samples=0;candidate=null;source='';last='';running=true;var token=++session;var n=names[selected],o;activeMode=n;activeId=null;add('Test '+n);
 try{if(/^(FACT |API )/.test(n)){o=deepStart(n);live=timer.createTimer(100,1000,function(){if(!running||session!==token)return;samples++;deepPoll(n,o);display();if(samples%30===0)save();});display();return;}var numeric=n.indexOf('ID ')===0,id=numeric?Number(n.slice(3)):hmSensor.id[n];if(numeric){activeId=id;results[n]='Pending';if(!journal(id,'before create'))throw Error('Journal failed');log('Testing ID '+id);save();}o=hmSensor.createSensor(id);if(numeric)journal(id,'create returned');if(!o)throw Error('null sensor');if(numeric)results[n]='Object returned';var s={o:o,started:false,listeners:[]};sensors=[s];if(numeric){inventorySensor(o);save();}
 var en=['CHANGE','DELAY'];try{Object.getOwnPropertyNames(hmSensor.event).forEach(function(k){if(/motion|accel|gravity|orient|gyro|tilt/i.test(k)&&en.indexOf(k)<0)en.push(k);});}catch(e){}for(var j=0;j<en.length;j++){(function(key){try{var id=hmSensor.event[key];if(typeof id!=='number'||typeof o.addEventListener!=='function')return;var fn=function(){if(!running||session!==token)return;events++;var args=[];for(var k=0;k<arguments.length;k++)args.push(arguments[k]);record(n+' '+key,args);display();};var ret=o.addEventListener(id,fn);log('Listener result '+describe(ret));s.listeners.push({id:id,fn:fn});log(n+' registered '+key+' '+id);}catch(e){log(key+' error '+e);}})(en[j]);}
 if(typeof o.start==='function'&&(!numeric||o.start.length===0)){try{o.start();s.started=true;log(n+' start returned');}catch(e){log('start error '+e);}}
 function tick(){if(!running||session!==token)return;samples++;try{if(n==='ACTIVITY'&&typeof o.getActivityInfo==='function')record(n+' poll',o.getActivityInfo());else if(n==='SLEEP'&&typeof o.getBasicInfo==='function')record(n+' basic',o.getBasicInfo());else if(n==='SPORT'&&samples===1&&typeof o.getSportRecord==='function')record(n+' record',o.getSportRecord());else if(numeric){var getters=['getCurrent','getData','getValue','getAcceleration','getOrientation','getGravity','getActivityInfo'];for(var g=0;g<getters.length;g++){var k=getters[g];if(typeof o[k]==='function'&&o[k].length===0){try{record(n+' '+k,o[k]());}catch(e){log(k+' '+e);}}}if(typeof o.getX==='function'&&typeof o.getY==='function'&&typeof o.getZ==='function'&&o.getX.length===0&&o.getY.length===0&&o.getZ.length===0)record(n+' axes',{x:o.getX(),y:o.getY(),z:o.getZ()});}}catch(e){last=String(e);log('poll error '+e);}display();if(samples%30===0)save();}
 live=timer.createTimer(100,1000,tick);display();
 }catch(e){stop();if(activeId!==null)results[n]=String(e);add(n+' error '+e);save();render();}}
 function button(x,y,w,t,f){hmUI.createWidget(hmUI.widget.BUTTON,{x:x,y:y,w:w,h:38,text:t,text_size:16,normal_color:0x225599,press_color:0x448855,click_func:f});}
 button(12,305,80,'PREV',function(){if(!running){pos--;render();}});
 button(100,305,80,'NEXT',function(){if(!running){pos++;render();}});
 button(12,349,80,'SELECT',function(){if(running||scanTimer!==null)return;deepArmed=false;selected=(selected+1)%names.length;show('Selected',[names[selected],'Press START','Test one sensor','at a time',fileState]);});
 button(100,349,80,'RUN/END',function(){if(running){stop();if(activeId!==null)results[activeMode]='OK E'+events+' S'+samples+(candidate?' XYZ?':'');add('Test '+activeMode);add('Events: '+events);add('Samples: '+samples);add('Last: '+last);if(candidate)add('XYZ? '+candidate.join(','));save();add(fileState);pos=Math.floor((lines.length-1)/8);render();}else start();});
 button(12,393,168,'DEEP SCAN',function(){if(running)return;if(scanTimer!==null){cancelScan();add('Scan cancelled');save();render();}else constructorScan();}); show('Selected',[names[selected],'RUN twice to test','Native crash possible','SELECT next sensor']);
 },onDestroy:function(){cleanup();}
 });
})();