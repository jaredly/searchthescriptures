
var SearchTheScriptures = Class([],{
  books:{},
  bookdata:{},
  __init__:function(self){
    $(self.load);
  },
  load:function(self){
    self._send({data:{'cmd':'load_books'},func:self.load_books});
    $('#searchbox button').click(self.search).mousemove(function(e){
      $(this).css('top',parseInt(e.clientY)+10+'px').css('left',parseInt(e.clientX)+10+'px');
    });
    $('#works').change(function(){
      self.load_work(this.value);
    });
    $('#back').click(function(){
      $(this).hide();
      $('#singleshow').hide();//.attr('src','');
    });
  },
  load_books:function(self,data){
    eval('var response='+data);
    console.log(response.length);
    for (var i=0;i<response.length;i++){
      if (!response[i][1].length)continue;
      $('<option>'+response[i][0]+'</option>').appendTo('#works');
      self.books[response[i][0]] = response[i][1];
    }
    self.load_work($('#works').val());
  },
  load_work:function(self,work){
    var totalsize = 0;
    $('#loading').show();
    $('#results').html('');
    for (var a=0;a<self.books[work].length;a++){
      totalsize += parseInt(self.books[work][a][1][1]);
    }
    console.log(totalsize);
    for (var a=0;a<self.books[work].length;a++){
      var book = self.books[work][a];
      self.bookdata[book[0]] = book[1];
      var bdiv = $('<div class="book" id="'+book[0]+'"><div class="title">'+book[1][0]+'</div></div>').appendTo('#results');
      
      for (var i=0;i<book[1][2];i++){
        var over = function(e){
          var off = $(this).offset();
          $('#hovertext').show().html($.data(this,'num')+' results').css('top',parseInt(e.clientY)+10+'px').css('left',parseInt(e.clientX)+10+'px');
        };
        var chap = $('<div class="chapter '+i+'">'+(i+1)+'</div>').appendTo(bdiv).css('width',(100/book[1][2])+'%').mouseout(function(){
          $('#hovertext').hide();
        }).mousemove(over).click(function(){
          self.show_chap($(this).parent().attr('id'),this.innerHTML);
        });
        $.data(chap[0],'num',0);
      }
    }
    $('#loading').hide();
  },
  show_chap:function(self,book,chap){
    $('#back').show();
    $('#singleshow').attr('src','').attr('src','index.py?cmd=show_chapter&book='+book+'&chap='+chap+'&term='+$('#search').val()).show();
  },
  search:function(self){
    self._send({data:{'cmd':'search','term':$('#search').val(),'work':$('#works').val(),'whole_word':$('#whole-word')[0].checked},func:self._search})
  },
  _search:function(self,data){
    eval('var results = '+data);
    var books = {};
    $('.chapter').css('background-color','#bbddff').each(function(){
      $.data(this,'num',0);
    });
    for (var i=0;i<results.length;i++){
      if (typeof(books[results[i][0]])==='undefined'){
        books[results[i][0]] = 0;
      }
      books[results[i][0]] += 1;
      
      var chap = $('#'+results[i][0]+' .'+results[i][1]);
      $.data(chap[0],'num',1+$.data(chap[0],'num'));
      var chrs = '0123456789abc';
      var num = $.data(chap[0],'num');
      if (num>chrs.length*3){
        num = chrs.length*3;
      }
      var c = chrs[parseInt(chrs.length-num/3)];
      chap.css('background-color','#f'+c+c);
    }
    for (var name in self.bookdata){
      if (!books[name])books[name]=0;
      $('#'+name+' .title').html(self.bookdata[name][0]+' - '+books[name]+' results');
    }
  },
  _send: function(self, options, queued){
    if (!options.url)options.url = 'index.py';
    $('#loading').show();
    $.post(options.url, options.data, function(){
      self.sending = false;
      $('#loading').hide();
      if (queued){
        if (options !== self._queue[0]){
          throw "Invalid Queue";
        }
        self._queue.shift();
        self._update_queue();
      }
      options.func.apply(self,arguments);
    });
  },
  
  _send_queued : function(self, options){
    var defaults = {
      url:'index.py',
      data:{},
      func:function(){},
      method:'POST'
    };
    options = $.extend(defaults,options);
    self._queue.push(options);
    self._update_queue();
  },
  
  _update_queue: function(self){
    if (self._queue.length && !self.sending){
      self.sending = true;
      self._send(self._queue[0],true);
    }
  },
  
});

var StS = SearchTheScriptures();
