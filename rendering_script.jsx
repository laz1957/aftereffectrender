#include "global_user_variables.jsx";
var RenderObj = new Object;
    RenderObj.SourceArray = new Array;
    RenderObj.Settings = (function ()
    {
        file = File(SETTINGSFILENAME);
        if(file.open('r'))
        {
                content = file.read();
                file.close();
                stuff = eval("(" + content + ")");
                return stuff;
        }
        else
        {
            return undefined;
        }
    })();
    RenderObj.getSource=function()
    {
        var textFile = File(this.Settings.ListSourceFile);
        var text;
        var data = [];
        if(textFile.open("r"))
        {
                while (!textFile.eof){
                    text = textFile.readln();
                    if (text.length > 0) {
                        data.push(text.split(",")); 
                    }
                }
                textFile.close();
            }
            return data;    
    }
    RenderObj.CreateComp = function (comp_name,video_file_name,text,emoji_text,isView)
    {
        var videoFile = File(video_file_name);
        if(videoFile)
        {
            var io = new ImportOptions(videoFile);
            var footage = app.project.importFile(io);

        
            var name = comp_name+"_"+ footage.name.replace(/\.[^\.]+$/, "");
            var width = footage.width;
            var height = footage.height;
            var fps = footage.frameRate;
            var duration = footage.duration;
            var pixelAspect = footage.pixelAspect

        
        var newComp = app.project.items.addComp(name, width,  height,pixelAspect,duration, fps);
        var video_layrel = newComp.layers.add(footage);
        if (video_layrel) { 
            newComp.height = video_layrel.source.height;
            var sourceRect = video_layrel.sourceRectAtTime(newComp.time, false);
            var centerAnchor = [
                sourceRect.left + sourceRect.width / 2,
                sourceRect.top + sourceRect.height / 2
            ];
            video_layrel.property("Anchor Point").setValue(centerAnchor);
            var textLayer = this.AddText(newComp,"texbox1",text);
            if(emoji_text != undefined){
                this.AddEmoji(newComp,textLayer,"emoji1",emoji_text)
            }


        }
            if(isView) {newComp.openInViewer();}
            return newComp;
        }
        else
        {
            return undefined;
        }
    } 
    RenderObj.AddText = function(comp,name,text)
    {
           var status = 0;
           var textW= comp.width*WIDTH_KOEFFICIENT;
           var textH = comp.height;

            var textLayer = comp.layers.addBoxText([textW,textH],text);
            textLayer.name = name;
            var textRect = GetLayerBoundsInComp(textLayer,comp.time)
            
            var textProp = textLayer.property("Source Text");
            var textDocument = textProp.value;
            textDocument.fontSize = BASE_FONT_SIZE;
            var oneTextLine = textDocument.fontSize*DELTA_LINE;
            var dubleTextLine = textDocument.fontSize*DELTA_LINE*2;
           // alert("h="+textRect.height+" out="+textRect.width+" left="+textRect.left+" top="+textRect.top+" bot="+textRect.bottom);
            if(textRect.height <= oneTextLine)
            {
                 textDocument.fontSize =BIG_FONT_SIZE;
                 status = 2;
            }
            if(textRect.height > oneTextLine && textRect.heigh <= dubleTextLine)
            {
                // textDocument.fontSize =BIG_FONT_SIZE;
                 status = 3;
            }
            if(text.length <= SMALL_TEXT_LENHT) {
                textDocument.fontSize = SUPER_BIG_FONT_SIZE;
                status =1;
            }
            textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
             
             textLayer.property("Anchor Point").setValue([0,0]);
             var centepComp = [comp.width/2,comp.height/2];
             var pos = textLayer.property("Position").value;
             var deltfaH  = (centepComp[1]-TOP_HEIGHT_TEXT)/3;
              var deltfaH3  = (centepComp[1]-TOP_HEIGHT_TEXT)/4;
             var targetLeft = (comp.width-textRect.width)/2;
             var targetTop  = TOP_HEIGHT_TEXT;
             if(status > 0){
                 targetTop =  targetTop+100;
             }
             if(status ==3){
                 targetTop =  targetTop+20;//+deltfaH3;
             }
             textProp.setValue(textDocument);
             SetLayerTopLeftByBounds(textLayer,targetLeft,targetTop,comp.time);
             return textLayer;

    }  
    RenderObj.AddEmoji = function(comp,textLayer,name,textEmaji){
        var imgpath = "";
        var jsonobj = this.Settings.ListEmojiImages;
         var projectFolder = new File($.fileName).parent.fsName;
        if (jsonobj[textEmaji] !== undefined) {
           var file_name = jsonobj[textEmaji];
           imgpath =projectFolder +"/"+ this.Settings.EmojiImagesPath +  file_name;
        }
        else{
           imgpath =projectFolder +"/"+ this.Settings.EmojiImagesPath +  this.Settings.DefaultEmojiImage;
        }
        var file = new File(imgpath)
         if(!file.exists) imgpath =projectFolder +"/"+ this.Settings.EmojiImagesPath +  this.Settings.DefaultEmojiImage;
        var emojiLaurel= AddEmojiLayer(name,textLayer,imgpath,comp);
 
       
    }

    RenderObj.RunRendering = function()
    {
        this.SourceArray = this.getSource();
        for(var i=1; i!= this.SourceArray.length;i++ )
        {
            var file_name =this.Settings.SourceVideoPath + this.SourceArray[i][PARAM];
            var file = File(file_name)
            if(file.exists)
            {
                    //alert(this.SourceArray[i][EMOJI]);   //-------------------------------------!!!!!!!!!



                    var emoji_text = undefined;
                    if(this.SourceArray[i].length >2){

                        emoji_text = this.SourceArray[i][EMOJI];
                    }
                                                  // Убери две косые полоски у  //emoji_text
                                                  //  проверь работу и удали или обратно закоментируй
                    //emoji_text ="x01";         //   Для проверки !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


                     var text =     this.SourceArray[i][CAPTION].toString();
                    var comp_name = "Comp"+i.toString();
                    var composit = this.CreateComp(comp_name,file_name,text,emoji_text,false)                     // Сщздание композиции
                    var outputfile_name=this.Settings.OutRenderPath+comp_name +"_"+this.SourceArray[i][PARAM]
                   

                   
                    if(composit != undefined)
                    {
                        var renderItem = app.project.renderQueue.items.add(composit);
                       // renderItem.outputModule(1).applyTemplate("Lossless");
                        var outputFile = new File(outputfile_name);
                        renderItem.outputModule(1).file = outputFile;
                         app.project.renderQueue.render();
                    }
            }

        }

        
    }

RenderObj.RunRendering();

    
alert("Обработка завершена!!!");

function GetLayerBoundsInComp(layer,t)
{
      
      var r = layer.sourceRectAtTime(t, false);
      var pos = layer.property("Position").value;
      var anc =   layer.property("Anchor Point").value;
      var left =  pos[0]+(r.left-anc[0]);
      var top =  pos[1]+(r.top-anc[1]);
      return {
        left:left,top:top,width:r.width,height:r.height,right:left+r.width,bottom:top+r.height
      }
}
function SetLayerTopLeftByBounds(layer,targetLeft,targetTop,t)
{
      var r = layer.sourceRectAtTime(t, false);
      var pos = layer.property("Position").value;
      var anc =   layer.property("Anchor Point").value;
      var left =  pos[0]+(r.left-anc[0]);
      var top =  pos[1]+(r.top-anc[1]);
      var dx=targetLeft-left;
      var dy = targetTop-top;
       layer.property("Position").setValue([ pos[0]+dx, pos[1]+dy]); 

}

function AddEmojiLayer(name,textLayer,pathImage,comp)
{
    
     var sizePx = EMOJYI_SIZE;
     var f = new File(pathImage);
    if(!f.exists) throw new Error("File not found:"+pathImage );
    app.beginUndoGroup("Create Image");
    var t= comp.time;
    var b = GetLayerBoundsInComp(textLayer,t);
    var io = new ImportOptions(f.fsName);
     var footage = app.project.importFile(io);
     var imgLayer = comp.layers.add(footage);
     
      var sourceRect = imgLayer.sourceRectAtTime(comp.time, false);
       var r = imgLayer.sourceRectAtTime(comp.time, false);

     var centerAnchor = [0,0];
     imgLayer.property("Anchor Point").setValue(centerAnchor );

     
     imgLayer.name=name;
     var scrH = footage.height;
     var scalePct = (sizePx/scrH)*100;
     imgLayer.property("Scale").setValue([scalePct,scalePct]);
     var renderW= footage.width*(scalePct/100);
      var renderH= footage.height*(scalePct/100);
      var pos = imgLayer.property("Position").value;
      
      var x =b.right-renderW/2; //b.left+b.width;//+pos[0];//+renderW;
      var y = b.top+b.height; //-renderH/2;
      //alert("b.right="+x+"b.top="+y);

       SetLayerTopLeftByBounds(imgLayer,x,y,t)
     app.endUndoGroup();
    
     return imgLayer;

}
function GetLayer(targetName,comp)
{
   
    var foundLayer = null;
    for (var i = 1; i <= comp.numLayers; i++) {
        alert(comp.layer(i).name);
        if (comp.layer(i).name == targetName) {
             
            foundLayer = comp.layer(i);
            break; // Остановить цикл после первого совпадения
        }
    }
    return foundLayer;
}
 