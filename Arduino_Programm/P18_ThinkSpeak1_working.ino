
#define SSID "FD-75"
#define PASSWORD "hardware"

#define ThingSpeakKEY "LKXMYXFEB20OHVV7"

#define SENSOR A6

#define LED_WLAN 13

#define DEBUG true

#include <SoftwareSerial.h>


SoftwareSerial esp8266(11, 12); // RX, TX

const char thingPost[] PROGMEM = {
  "POST *URL* HTTP/1.1\nHost: api.thingspeak.com\nConnection: close\nContent-Type: application/x-www-form-urlencoded\nContent-Length: *LEN*\n\n*APPEND*\n\0"
};

//-----------------------------------------Konfiguration des Arduino ------------------------------------

void setup() {
  Serial.begin(19200);
  esp8266.begin(19200);
  pinMode(A0,INPUT);
  
 Serial.println("THINGSPEAK");

  if (!espConfig()) serialDebug();
  else digitalWrite(LED_WLAN, HIGH);

 
  Serial.print("WLAN CONNECTED");

}
float energy = 0;
int i = 0;
int x = 1;

//-----------------------------------------Der Messvorgang im Loop------------------------------------

void loop() {
  
  int sensorValue = analogRead(A0);
  float voltage = sensorValue * (5 / 1024.00);
  Serial.println("Die Spannung beträgt:");
  Serial.println(voltage);
  float current = voltage/100;
  Serial.println("Die Strom beträgt:");
  Serial.println(current);
  float Power = voltage * current;
  Serial.println("Die Power beträgt:");
  Serial.println(Power);
  energy = energy + Power;
  i = i +1;
  Serial.println("Es wurde produziert:");
  Serial.println(energy);
  
  if (i/20 == x){
    
    if (sendThingPost(ThingSpeakKEY, energy))
    { debug("Update Send");
     Serial.println(" Update:" + String(energy));
    }
    x = x+1;
    energy = energy - energy;
  }
  
  
  delay(1000);
}


//-----------------------------------------ThingsSpeak Funktionen------------------------------------

boolean sendThingPost(String key, float value)
{
  boolean success = true;
  String  Host = "api.thingspeak.com";
  String msg = "field1=" + String(value);
  success &= sendCom("AT+CIPSTART=\"TCP\",\"" + Host + "\",80", "OK");

  String postRequest = createThingPost("/update", key, msg);

  if (sendCom("AT+CIPSEND=" + String(postRequest.length()), ">"))
  {
    esp8266.print(postRequest);
    esp8266.find("SEND OK");
    if (!esp8266.find("CLOSED")) success &= sendCom("AT+CIPCLOSE", "OK");
  }
  else
  {
    success = false;
  }
  return success;
}

String createThingPost(String url, String key, String msg)
{
  String xBuffer;

  for (int i = 0; i <= sizeof(thingPost); i++)
  {
    char myChar = pgm_read_byte_near(thingPost + i);
    xBuffer += myChar;
  }

  String append = "api_key=" + key + "&" + msg;
  xBuffer.replace("*URL*", url);
  xBuffer.replace("*LEN*", String( append.length()));
  xBuffer.replace("*APPEND*", append);
  return xBuffer;
}

String createThingGet(String url, String key)
{
  String xBuffer;

  for (int i = 0; i <= sizeof(thingPost); i++)
  {
    char myChar = pgm_read_byte_near(thingPost + i);
    xBuffer += myChar;
  }

  String append = "api_key=" + key;
  xBuffer.replace("POST", "GET");
  xBuffer.replace("*URL*", url);
  xBuffer.replace("*LEN*", String( append.length()));
  xBuffer.replace("*APPEND*", append);

  return xBuffer;
}

String createThingGet(String url, String key, String msg)
{
  String xBuffer;

  for (int i = 0; i <= sizeof(thingPost); i++)
  {
    char myChar = pgm_read_byte_near(thingPost + i);
    xBuffer += myChar;
  }

  String append = "api_key=" + key + "&" + msg;

  xBuffer.replace("POST", "GET");
  xBuffer.replace("*URL*", url);
  xBuffer.replace("*LEN*", String( append.length()));
  xBuffer.replace("*APPEND*", append);

  return xBuffer;
}

//-----------------------------------------WLAN-Modul-Konfigurationen------------------------------------

boolean espConfig()
{
  boolean success = true;
  esp8266.setTimeout(5000);
  success &= sendCom("AT+RST", "ready");
  esp8266.setTimeout(1000);

  if (configStation(SSID, PASSWORD)) {
    success &= true;
    debug("WLAN Connected");
    debug("My IP is:");
    debug(sendCom("AT+CIFSR"));
  }
  else
  {
    success &= false;
  }
  //shorter Timeout for faster wrong UPD-Comands handling
  success &= sendCom("AT+CIPMUX=0", "OK");
  success &= sendCom("AT+CIPMODE=0", "OK");

  return success;
}

boolean configTCPServer()
{
  boolean success = true;

  success &= (sendCom("AT+CIPMUX=1", "OK"));
  success &= (sendCom("AT+CIPSERVER=1,80", "OK"));

  return success;

}

boolean configTCPClient()
{
  boolean success = true;

  success &= (sendCom("AT+CIPMUX=0", "OK"));
  //success &= (sendCom("AT+CIPSERVER=1,80", "OK"));

  return success;

}


boolean configStation(String vSSID, String vPASSWORT)
{
  boolean success = true;
  success &= (sendCom("AT+CWMODE=1", "OK"));
  esp8266.setTimeout(20000);
  success &= (sendCom("AT+CWJAP=\"" + String(vSSID) + "\",\"" + String(vPASSWORT) + "\"", "OK"));
  esp8266.setTimeout(1000);
  return success;
}

boolean configAP()
{
  boolean success = true;

  success &= (sendCom("AT+CWMODE=2", "OK"));
  success &= (sendCom("AT+CWSAP=\"NanoESP\",\"\",5,0", "OK"));

  return success;
}

boolean configUDP()
{
  boolean success = true;

  success &= (sendCom("AT+CIPMODE=0", "OK"));
  success &= (sendCom("AT+CIPMUX=0", "OK"));
  success &= sendCom("AT+CIPSTART=\"UDP\",\"192.168.255.255\",90,91,2", "OK"); //Importand Boradcast...Reconnect IP
  return success;
}



boolean sendUDP(String Msg)
{
  boolean success = true;

  success &= sendCom("AT+CIPSEND=" + String(Msg.length() + 2), ">");    //+",\"192.168.4.2\",90", ">");
  if (success)
  {
    success &= sendCom(Msg, "OK");
  }
  return success;
}


boolean sendCom(String command, char respond[])
{
  esp8266.println(command);
  if (esp8266.findUntil(respond, "ERROR"))
  {
    return true;
  }
  else
  {
    debug("ESP SEND ERROR: " + command);
    return false;
  }
}

String sendCom(String command)
{
  esp8266.println(command);
  return esp8266.readString();
}


void serialDebug() {
  while (true)
  {
    if (esp8266.available())
      Serial.write(esp8266.read());
    if (Serial.available())
      esp8266.write(Serial.read());
  }
}

void debug(String Msg)
{
  if (DEBUG)
  {
    Serial.println(Msg);
  }
}
