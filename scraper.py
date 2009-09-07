
import re
from urllib import urlopen as upen

def links(url,href,contents = None):
  txt = upen(url).read()
  if contents:
    sch = re.search(contents,txt,re.S|re.I)
    if not sch:
      print "contents not found, for pattern '%s' on page '%s'"%(contents,url)
      return []
    txt = sch.group()
  #print txt
  rgx = re.compile('<a\s[^>]*href=["\']' + href + '[\'"][^>]*>(.+?)</a>', re.I|re.S)
  return rgx.findall(txt)
