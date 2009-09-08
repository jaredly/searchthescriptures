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

def load_booklist():
  std = libbom.StdWks()
  works = list([wk.name,[[a,[b[0],str(b[1]),c]] for a,b,c in wk.allbooks()]] for wk in std)
  for wk in std:
    books = wk.allbooks()
    if not books:
      continue
    print '<div class="work" id="work-'+wk.short+'"><div class="title">'+wk.name+'</div>'
    for short, (name, size), chapters in books:
      print '<style> #book-%s .chapter { width: %s%%; }</style>'%(short, 100.0/chapters)
      print '<div class="book" id="book-'+short+'"><div class="title">'+name+'</div>'
      for i in range(chapters):
        print '<div class="chapter ch%d">%d</div>'%(i,i+1)
      print '</div>'
    print '</div>'

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
  res = list(chap.search(form['term'].value,whole = (form.has_key('whole_word') and form['whole_word'].value=='true')))
  rgx = re.compile(fixrgx(form['term'].value),re.I)
  #print '<pre>',fixrgx(form['term'].value),'</pre>'
  for v in res:
    print rgx.sub(highlight,clean(chap[v].encode('utf8'))).replace(" onclick='return toggleMarked(event, this)'",'')
    print '<div class="show-all">Expand to show whole chapter</div>'
  if not res:
    print '<h2>No results</h2>'

def show_whole_chapter():
  std = libbom.StdWks()
  ref = re.sub('\([^)]+\)','',form['ref'].value.replace(': ',':')).split(' ')
  if len(ref)<2:
    raise Exception
  book = ref[0].strip('. ')
  cv = ref[1]
  if ':' in cv:
    c,v = cv.split(':')
  else:
    c=cv
    v=None#ref[2]
  #v = re.findall('\d+',v)[0]
  
  #chap = std[form['book'].value][int(form['chap'].value)-1]
  chap = std[book][int(c)-1]
  
  search = form.has_key('term')
  print '<div class="crumb">'+ref+'</div>'
  if search:
    res = list(chap.search(form['term'].value,whole = (form.has_key('whole_word') and form['whole_word'].value=='true')))
    rgx = re.compile(fixrgx(form['term'].value),re.I)
    print '<div class="jump">Jump to result # '
    for v in res:
      print '<a href="javascript:void(0);" class="result">%d</a> '%(v+1)
    print '<a href="javascript:void(0);" class="collapse">Collapse to search results</a>'
    print '</div>'
  
  for v in range(len(chap)):
    if search:
      print rgx.sub(highlight,clean(chap[v].encode('utf8'))).replace(" onclick='return toggleMarked(event, this)'",'')
    else:
      print clean(chap[v].encode('utf8')).replace(" onclick='return toggleMarked(event, this)'",'')

def clean(verse):
  return re.sub('<div id="[^"]+(\\d+)"',lambda a:'<div class="verse" id="verse-%s"'%a.groups()[0],verse)  

def fixrgx(t):
  fixed = re.sub('(\w+)',lambda a:'(?:<sup>\w</sup>)?(?:<[^>]+>)*'+a.group()+'(?:<[^>]+>)*',t).replace(' ','[\s\W,]+')
  if form.has_key('whole_word') and form['whole_word'].value=='true':
    fixed = '\W'+fixed+'\W'
  return fixed

def highlight(a):
  if notintag(a.string[:a.start()]):
    return '<span class="highlight">'+a.group()+'</span>'
  return a.group()

def notintag(x):
  return x.count('<')==x.count('>')

requireds = {'load_booklist':[],
             'search':['term'],
             'show_chapter':['book','chap','term'],
             'show_whole_chapter':['book','chap']}
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

