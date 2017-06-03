var _icon = "http://dic.nicovideo.jp/oekaki/630163.png";
var _name = "Bot住殿";

function doPost(e) {
  var prop =  PropertiesService.getScriptProperties().getProperties();
  var slackApp = SlackApp.create(prop.token); 
  var channelId = slackApp.channelsList().channels[0].id;
  var text = e.parameter.text;
  
  var ret = is575(text);
  if(ret.is575 && !e.parameter.text.match("575を見つけました")){
    var log = slackApp.postMessage(e.parameter.channel_id, "575を見つけました。「" + ret.text + "」", {
      username : _name,
      icon_url:_icon,
      "mrkdwn": true
    });
  }
  return null;
}

function is575(text) { //"見舞客元気過ぎても疲れ出る"
  
  var ret_is575 = false;
  var ret_text = "";
  var join = "";
  
  var feedURL = "https://jlp.yahooapis.jp/MAService/V1/parse?appid=" + PropertiesService.getScriptProperties().getProperties().appid +"&results=ma&sentence=";
  var response = UrlFetchApp.fetch(feedURL + encodeToRfc3986(text));
  var xml = XmlService.parse(response.getContentText());
  var namespace = XmlService.getNamespace("urn:yahoo:jp:jlp");
  var words = xml.getRootElement().getChild('ma_result',namespace).getChild('word_list',namespace).getChildren('word',namespace);
  
  for(var k = 0; k < words.length; k++) {
    Logger.log(words[k].getChild("pos",namespace).getText() + "\t" + words[k].getChild("reading",namespace).getText());
  }
  
  for(var k = 0; k < words.length; k++) {
    var counter = [0,0,0];
    join = "";
    var seek = 0;
    var init_flag = true;
    for(var i = 0; i < words.length-k; i++) {
      var reading = words[k+i].getChild("reading",namespace).getText();
      if(reading.match(/[a-zA-Z]/)) break;
      var num_character = ["0","1","2","3","4","5","6","7","8","9","10"];
      var num_yomi = ["ぜろ","いち","に","さん","よん","ご","ろく","なな","はち","きゅう","じゅう"];
      for(var j = 0; j < num_character.length; j++) reading = reading.replace(num_character[j],num_yomi[j]);
      var invalid_character = ["ゃ","ゅ","ょ","ぁ","ぃ","ぅ","ぇ","ぉ"];
      for(var j = 0; j < invalid_character.length; j++) reading = reading.replace(invalid_character[j],"");
      var pos = words[k+i].getChild("pos",namespace).getText()
      if(pos == "特殊") reading = "";
      if(counter[0]<5){
        if(init_flag && pos == "助詞") break;
        else counter[0] += reading.length;
        init_flag = false;
        if(counter[0]>=5)init_flag = true;
      }else if(counter[1]<7){
        if(init_flag && pos == "助詞" && reading.length == 1) counter[0]++
        else counter[1] += reading.length;
        init_flag = false;
        if(counter[1]>=7)init_flag = true;
      }else if(counter[2]<5){
        if(init_flag && pos == "助詞" && reading.length == 1) counter[1]++
        else counter[2] += reading.length;
        init_flag = false;
        if(counter[2]>=5)init_flag = true;
      }else{
        if(!init_flag) break;
        if(init_flag && pos == "助詞" && reading.length == 1) counter[2]++
        else break;
        init_flag = false;
      }
      join += words[k+i].getChild("surface",namespace).getText();
    }
    Logger.log(counter);
    if((counter[0] == 5 || counter[0] == 6) && (counter[1] == 7 || counter[1] == 8) && (counter[2] == 5 || counter[2] == 6)){
      ret_is575 = true;
      ret_text = join;
      break;
    }
  }
  if(ret_text.match("（") && !ret_text.match("）")) ret_text=ret_text.replace("（","");
  if(ret_text.match("「") && !ret_text.match("」")) ret_text=ret_text.replace("「","");
  if(!ret_text.match("（") && ret_text.match("）")) ret_text=ret_text.replace("）","");
  if(!ret_text.match("「") && ret_text.match("」")) ret_text=ret_text.replace("」","");
  return {is575: ret_is575, text: ret_text};
}

function encodeToRfc3986(str) {
  return encodeURIComponent(str).replace(/[!'()]/g, function(char) {
    return escape(char);
  }).replace(/\*/g, "%2A");
}