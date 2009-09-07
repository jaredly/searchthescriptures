#!/usr/bin/env python

import os,sys,re
import cgi
import base64
import json
import random

sys.stderr = sys.stdout
form = cgi.FieldStorage()

import subprocess
import libbom


def die(cause = 'Invalid Arguments'):
  print 'Content-type:text/html\n'
  print '<h2>'+cause+'</h2>'
  sys.exit(0)

def load_books():
  std = libbom.StdWks()
  if form.has_key('work'):
    print std[form['work'].value].books
  else:
    print list([wk.name,[[a,[b[0],str(b[1]),c]] for a,b,c in wk.allbooks()]] for wk in std)

def search():
  std = libbom.StdWks()
  if form.has_key('work'):
    std = std[form['work'].value]
  if form.has_key('book'):
    std = std[form['book'].value]
    if form.has_key('chap'):
      std = std[form['chap'].value]
  if form.has_key('whole_word') and form['whole_word'].value=='true':
    print std.search(form['term'].value,whole=True)
  else:
    print std.search(form['term'].value)

def show_chapter():
  std = libbom.StdWks()
  chap = std[form['book'].value][int(form['chap'].value)-1]
  res = list(chap.search(form['term'].value))
  print '''<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
"http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<style>
.highlight {
  background-color:#ff9;
} 
#contents div {
  padding-top:5px;
} 
#contents div:hover {
  background-image:url(expand.png);
  background-repeat:no-repeat;
  background-position:5px 0;
}
#contents sup {
  position:absolute;
  margin-top:-5px;
}
#contents a {
  margin-left:8px;
}
</style>
<script src="jquery.js"></script>
<script src="iframe.js"></script>
</head>
<body>
<div id="nav"></div>
<div id="contents">
'''
  rgx = re.compile(fixrgx(form['term'].value),re.I)
  #print '<pre>',fixrgx(form['term'].value),'</pre>'
  for v in res:
    print rgx.sub(highlight,chap[v].encode('utf8')).replace(" onclick='return toggleMarked(event, this)'",'')
    #print chap[v].encode('utf8').replace(form['term'].value, '<span class="highlight">' + form['term'].value + '</span>')
  print '''
</div>
</body>
</html>
'''

def fixrgx(t):
  fixed = re.sub('(\w+)',lambda a:'(?:<sup>\w</sup>)?(?:<[^>]+>)*'+a.group()+'(?:<[^>]+>)*',t).replace(' ','[\s\W,]+')
  if form.has_key('whole_word'):
    fixed = '\W'+fixed+'\W'
  return fixed

def highlight(a):
  return '<span class="highlight">'+a.group()+'</span>'

requireds = {'load_books':[],
             'search':['term'],
             'show_chapter':['book','chap','term']}
custom_type = []

if __name__=='__main__':
    try:
        if not form.has_key('cmd') or not form['cmd'].value in requireds:
            die('Invalid Command')
        for req in requireds[form['cmd'].value]:
            if not form.has_key(req):
                die('missing argment %s'%req)
        if not form['cmd'].value in custom_type:
          print 'Content-type:text/html\n'
        globals()[form['cmd'].value]()
    except:
        print 'Content-type:text/plain\n'
        raise

