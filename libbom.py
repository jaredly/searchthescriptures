#!/usr/bin/env python

import re
import os,sys

def arraysum(*args):
  if len(args)==1:
    args = args[0]
  ret = []
  for a in args:
    ret += list(a)
  return ret

class StdWks:
  _cache = {}
  def __init__(self):
    works = list((a,re.sub('<[^>]+>','',b)) for a,b in eval(open('works.list').read()))
    self.wdict = dict(works)
    self.wrev = dict(zip(self.wdict.values(),self.wdict.keys()))
    self.works = [w[0] for w in works if os.path.exists(os.path.join(w[0],'books.list'))]
  
  def work(self,name):
    if not self._cache.has_key(name):
      self._cache[name] = Work(self,name,self.wdict[name])
    return self._cache[name]
  
  def __iter__(self):
    return (self.work(w) for w in self.works).__iter__()
  
  def __getitem__(self,i):
    if type(i)==int:
      return self.work(self.works[i])
    else:
      if self.wdict.has_key(i):
        return self.work(i)
      elif self.wrev.has_key(i):
        return self.work(self.wrev[i])
      else:
        for wk in self:
          if i in wk:
            return wk[i]
        raise Exception,"No such Work or Book found"
  
  def __len__(self):
    return len(self.works)
  
  def search(self,term,whole=False):
    return arraysum(((work.short,)+res for res in work.search(term,whole=whole)) for work in self)

class Work:
  _caches = {}
  def __init__(self,parent,short,name):
    self.parent = parent
    self.short = short
    self.name = name
    books = eval(open(os.path.join(short,'books.list')).read())
    self.bdict = dict(books)
    self.brev = dict((v[0],k) for k, v in self.bdict.iteritems())
    self.books = list(b[0] for b in books)
    if not Work._caches.has_key(short):
      Work._caches[short] = {}
    self._cache = Work._caches[short]
  
  def __iter__(self):
    return (self.book(book) for book in self.books).__iter__()
  
  def __getitem__(self,i):
    if type(i)==int:
      return self.books(self.books[i])
    else:
      if self.bdict.has_key(i):
        return self.book(i)
      elif self.brev.has_key(i):
        return self.book(self.brev[i])
      else:
        raise Exception,"No such Work found"
  
  def __contains__(self,i):
    if type(i)==int:
      return 0<=i<len(self.books)
    else:
      if self.bdict.has_key(i):
        return True
      elif self.brev.has_key(i):
        return True
    return False
  
  def __len__(self):
    return len(self.books)
  
  def allbooks(self):
    return list([s,self.bdict[s],len(self.book(s))] for s in self.books)
  
  def book(self,short):
    if not self._cache.has_key(short):
      self._cache[short] = Book(self,short,self.bdict[short])
    return self._cache[short]
  
  def search(self,term,whole=False):
    return arraysum(([book.short]+list(res) for res in book.search(term,whole=whole)) for book in self)
  
  def loadall(self):
    list(self.book(name) for name in self.books)

def load_chaper(work,book,chap):
  text = open(os.path.join(work,book,chap+'.html')).read()
  

class Book:
  _caches = {}
  def __init__(self,parent,short,(name,size)):
    self.parent = parent
    self.short = short
    self.name = name
    self.size = size
    self.chaps = list(int(x.split('.')[0]) for x in os.listdir(os.path.join(parent.short,short)) if x.endswith('.html'))
    self.chaps.sort()
    if not Book._caches.has_key(parent.short):
      Book._caches[parent.short] = {}
    if not Book._caches[parent.short].has_key(short):
      Book._caches[parent.short][short] = {}
    self._cache = Book._caches[parent.short][short]
  
  def __iter__(self):
    return (self.chap(chap) for chap in self.chaps).__iter__()
  
  def __getitem__(self,i):
    return self.chap(self.chaps[i])
  
  def __len__(self):
    return len(self.chaps)
  
  def chap(self,chap):
    if not self._cache.has_key(chap):
      self._cache[chap] = Chapter(self,chap)
    return self._cache[chap]
  
  def search(self,term,whole=False):
    return arraysum(((chap.num,v) for v in chap.search(term,whole=whole)) for chap in self)

class Chapter:
  rx = {'summery':re.compile('<div class="summary">(.+?)</div>',re.S),
        'verse':re.compile('<div class="verse">(.+?</div>)\n</div>',re.S),
        'footnotes':re.compile('<a href="[^"]+" mark="(\w+)" type="\w" title="([^"]+)">([^<]+)</a>')}
  def __init__(self,parent,num):
    self.parent = parent
    self.num = int(num)-1
    self.load()
  
  def load(self):
    fname = os.path.join(self.parent.parent.short,self.parent.short,str(self.num+1)+'.html')
    text = open(fname).read().decode('utf8')
    self.summery = self.rx['summery'].findall(text)
    if self.summery:
      self.summery = self.summery[0]
    else:
      self.summery = ''
      print 'no summery....',fname
    
    self.verses = self.rx['verse'].findall(text)
    self.footnotes = {}
    for i,v in enumerate(self.verses):
      self.footnotes[i] = self.rx['footnotes'].findall(v)

  def __iter__(self):
    return self.verses.__iter__()
  
  def __getitem__(self,i):
    return self.verses[i]
  
  def __len__(self):
    return len(self.verses)

  def search(self,term, whole=False,rx=False, justverse=True):
    if rx:
      rx = re.compile(term)
      wrx = re.compile('\W'+term+'\W')
      f = lambda a:rx.search(a)
      wf = lambda a:wrx.search(a)
    else:
      term = term.lower()
      rx = re.compile('\W'+re.escape(term)+'\W')
      f = lambda a:a.lower().find(term)!=-1
      wf = lambda a:rx.search(a)
    if not justverse:
      if f(self.summery):
        yield (0)
    for i,v in enumerate(self.verses):
      if f(clean(v)):
        if whole:
          if wf(clean(v)):
            yield (i)
        else:
          yield (i)

def clean(x):
  return re.sub('<[^>]+>','',re.sub(re.escape('<sup>') + '\w' + re.escape('</sup>'),'',x)).replace(',','')
    
