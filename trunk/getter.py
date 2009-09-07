#/usr/bin/env python

'''
  DL the scriptures + footnotes
  + topical guide
  + bible dictionary
'''

import scraper
import os,sys
import threading
import glob
import re

import socket
socket.setdefaulttimeout(5)

debug = True

base = 'http://scriptures.lds.org/'

works = scraper.links(base, '([^\/]+)/contents')

dontget = ['helps']

def get_work(work):
  books = scraper.links(base + 'en/'+work+'/contents', '([^/]+)/contents', '<center>.+?</center>')
  if not os.path.isdir(work):
    os.mkdir(work)
  elif os.path.isfile(os.path.join(work,'.done')):
    for i,(name,n) in enumerate(books):
      sz = 0
      fd = os.path.join(work,name)
      if os.path.isdir(fd):
        for fl in os.listdir(fd):
          sz += os.path.getsize(os.path.join(fd,fl))
        books[i] = [name,[re.sub('\([^\)]+\)','',n).strip(),sz]]
        open(os.path.join(fd,'size.dat'),'w').write(str(sz))
    open(os.path.join(work,'books.list'),'w').write(str(books))
    return
  if debug:print 'books for',work,books
  if not books:
    print 'special',work
  for book,name in books:
    if book in works+dontget:
      continue
    get_book(work, book)
    #break
  open(os.path.join(work,'.done'),'w').close()

def get_book(work, book):
  if not os.path.isdir(os.path.join(work,book)):
    os.mkdir(os.path.join(work,book))
  chaps = scraper.links(base + 'en/'+book+'/contents', book + '/([^\'"]+)')
  if debug:print 'chaps for',book,chaps
  for chap in chaps:
    if os.path.isfile(os.path.join(work,book,chap+'.html')):
      continue
    txt = scraper.upen(base + 'en/' + book + '/' + chap).read()
    contents = txt[txt.find('''<div style="margin-left:0%; margin-right:0%">
<div class="title">'''):txt.find('''</div>
<table class='footer' width='100%' border='0' cellspacing='0' cellpadding='0'>''')]
    if not contents:
      print 'couldnt find contents for %s/%s'%(book,chap)
      continue
    open(os.path.join(work,book,chap+'.html'),'w').write(contents)
    print '.',
    sys.stdout.flush()
  print
  

if __name__=='__main__':
  for work,name in works:
    if work in dontget:continue
    print work
    threading.Thread(target=get_work,args=[work]).start()
  open('works.list','w').write(str(works))
    

