(function () {
 var currentApp = __$$hmAppManager$$__.currentApp;
 var currentModule = currentApp.current;
 currentModule.module = DeviceRuntimeCore.Page({
  onInit: function () {},
  build: function () {
   var count = 0;
   hmUI.createWidget(hmUI.widget.TEXT,{x:8,y:75,w:176,h:45,text:"Sensor Probe 0.2",text_size:19,color:0xffffff,align_h:hmUI.align.CENTER_H});
   hmUI.createWidget(hmUI.widget.TEXT,{x:8,y:145,w:176,h:48,text:"APP RUNNING",text_size:21,color:0x55ff88,align_h:hmUI.align.CENTER_H});
   var status = hmUI.createWidget(hmUI.widget.TEXT,{x:8,y:210,w:176,h:45,text:"Count: 0",text_size:22,color:0xffffff,align_h:hmUI.align.CENTER_H});
   hmUI.createWidget(hmUI.widget.BUTTON,{x:20,y:280,w:152,h:55,text:"TEST",text_size:24,normal_color:0x225599,press_color:0x44aa66,click_func:function(){count++;status.setProperty(hmUI.prop.TEXT,"Count: "+count);}});
  },
  onDestroy: function () {}
 });
})();
