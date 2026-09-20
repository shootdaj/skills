#include <keyfinder/keyfinder.h>
#include <cstdio>
#include <vector>
#include <string>
// reads raw float32 mono 44100 PCM from stdin, prints Camelot key
int main(){
  const unsigned sr=44100;
  std::vector<float> buf; float tmp[8192]; size_t n;
  while((n=fread(tmp,sizeof(float),8192,stdin))>0) buf.insert(buf.end(),tmp,tmp+n);
  KeyFinder::AudioData a; a.setFrameRate(sr); a.setChannels(1); a.addToSampleCount(buf.size());
  for(size_t i=0;i<buf.size();i++) a.setSample(i,buf[i]);
  KeyFinder::KeyFinder k; KeyFinder::key_t key=k.keyOfAudio(a);
  const char* cam[]={"8B","5A","3B","12A","10B","7A","5B","2A","12B","9A","7B","4A","2B","11A","9B","6A","4B","1A","11B","8A","6B","3A","1B","10A","SILENCE"};
  // enum order: A_MAJOR,A_MINOR,B_FLAT_MAJOR,B_FLAT_MINOR,B_MAJOR,B_MINOR,C_MAJOR,C_MINOR,D_FLAT_MAJOR,D_FLAT_MINOR,D_MAJOR,D_MINOR,E_FLAT_MAJOR,E_FLAT_MINOR,E_MAJOR,E_MINOR,F_MAJOR,F_MINOR,G_FLAT_MAJOR,G_FLAT_MINOR,G_MAJOR,G_MINOR,A_FLAT_MAJOR,A_FLAT_MINOR,SILENCE
  const char* cam2[]={"11B","8A","6B","3A","1B","10A","8B","5A","3B","12A","10B","7A","5B","2A","12B","9A","7B","4A","2B","11A","9B","6A","4B","1A","-"};
  int i=(int)key; if(i<0||i>24) i=24; printf("%s\n",cam2[i]); return 0; }
