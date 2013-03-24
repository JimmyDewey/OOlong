/*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
 *==================================================
 * @author Dewey
 * @2011.10.27
 * 依赖于jQuery，interface，spin
 *==================================================
 * --id命名规则：
 * ----id: 窗体id
 * ----id + 'i': 快捷方式icon
 * ----id + 'f': 窗体内容区iframe
 * ----id + 'h': 窗体“恢复”按钮，为方便点击时确定窗体大小
 * ----id + 's': 加载时显示的spin
 * ----id + 'd': dock区item
 * ================================================
 * @2011.10.28
 * ::::修正了chrome，firefox下托放问题(奇了怪了，每次都只一个可以)
 * ::::增加了可控打开窗口大小功能
 * ::::点击内容区不能获得焦点问题有待解决
 * ================================================
 * @2011.11.3
 * ::::增加了主窗体加载动画蒙板
 * ::::增加了设定背景图功能，并利用cookie来记录用户设定
 * ================================================
 * @2011.11.4
 * ::::增加alert功能
 * ================================================
 * @2011.11.5
 * ::::修复cookie不能正确读取问题
 * ::::修复windows下alert的滞后，内容继承问题
 * ::::将服务器端的*.json后缀改为*.js
 * ================================================
 *%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

var OOlong = {
	wh : null,
	apps : [],
	win : '<div class="win_current" id="{id}" style="width:{width}px;height:{height}px;"><div class="win_title" >{title}<div class="win_handle"><a class="min"></a><a class="max"></a><a class="revert" id="{id}h"></a><a class="close"></a></div></div><div class="spin" id="{id}s"></div><iframe class="win_content" id="{id}f" src="{src}"></iframe></div>',
	icon : '<div class="icon" id="{id}i"><div class="shadow"></div><div class="icon_pic"><img src="icons/{id}.png" alt="{title}"/></div><div class="icon_title">{title}</div></div>',
	dock : '<a class="dock-item2" id="{id}d" href="#{id}"><span>{title}</span><img src="icons/{id}.png" /></a>',
	messagebox : null,
	spinOpts : {
		lines : 12,
		length : 27,
		width : 20,
		radius : 14,
		color : '#fff',
		speed : 1.6,
		trail : 50,
		shadow : true
	}
};

/****************************************************
 * 主界面的初始化 *
 ----
 ****************************************************
 */
OOlong.init = function() {

	//隐藏所有右键列表
	$(document).bind("contextmenu", function(e) {
		return false;
	});
	//初始化loading图
	Spinner({
		lines : 16,
		length : 30,
		width : 20,
		radius : 40,
		color : '#fff',
		speed : 1.6,
		trail : 50,
		shadow : true
	}).spin(document.getElementById('loading'));

	//设置背景图片
	$('#background').attr('src', OOlong.getBGformCookie);

	OOlong.getWH();
	$(window).bind('load', function() {
		OOlong.initIcon();
		OOlong.dockClick($('.dock'));
		OOlong.refreshDock();
	}).resize(function() {/*窗口大小变化时重新调整icon布局*/
		OOlong.wh = OOlong.getWH();
		OOlong.rePlaceIcon();
	}).bind('load', function() {
		$('#loading').fadeOut(800);
		OOlong.initNav();
	});
}
/****************************************************
 * 获得当前页面可视区域的长宽 *
 ****************************************************
 */
OOlong.getWH = function() {
	var w = window.innerWidth;
	var h = window.innerHeight;
	if( typeof h != "number") {
		if(document.compatMode == "CSS1Compat") {
			h = document.documentElement.clientHeight;
			w = document.documentElement.clientWidth;
		} else {
			h = document.body.clientWidth;
			w = document.body.clientWidth;
		}
	};
	return OOlong.wh = {
		width : w,
		height : h,
	};
}
/****************************************************
 * 初始化排列快捷方式图标 *
 ----通过AJAX获得 apps/app.json 信息
 ****************************************************
 */
OOlong.initIcon = function() {
	$.getJSON("apps/apps.js", function(apps) {
		var container = $('.icon_container');
		OOlong.apps = apps['desk1'];
		for(var i = 0; i < apps['desk1'].length; i++) {
			container.append(OOlong.format(OOlong.icon, OOlong.apps[i]));
			/*为icon创建悬停阴影*/
			$("#" + apps['desk1'][i].id + "i").hover(function() {
				$(".shadow", $(this)).stop().fadeTo("normal", 0.4);
			}, function() {
				$(".shadow", $(this)).stop().fadeTo("normal", 0);
			});
		};
	});
	OOlong.iconClick($('.icon_container'));
}
/****************************************************
 * 重新定位快捷方式图标 *
 ----
 ****************************************************
 */
OOlong.rePlaceIcon = function() {
	if(OOlong.wh.width < 1280) {
		$('.icon_container').width(OOlong.wh.width - 90).height(OOlong.wh.height - 100);
	} else {
		$('.icon_container').width(980);
	}
}
/****************************************************
 * 新建窗体，并注册新建窗体的所有事件 *
 ----窗体内容，获得焦点
 ----dock栏内容增加
 ****************************************************
 */
OOlong.iconClick = function(obj) {
	obj.find('.icon').live('click', function(e) {
		//阻止冒泡
		e.stopPropagation();
		var id = $(this).attr('id').slice(0, -1);
		if($('#' + id + 'd').length > 0) {
			var w = $('#' + id);
			if(!w.is(':visible')) {
				w.fadeIn("normal");
			}
		} else {
			var app = OOlong.findApp(id);
			$('body').append(OOlong.format(OOlong.win, app));
			Spinner(OOlong.spinOpts).spin(document.getElementById(id + 's'));
			$('#' + id + 'f').bind('load', function(e) {
				//阻止冒泡
				e.stopPropagation();
				$('#' + id + 's').fadeOut("normal");
			});
			var w = $('#' + id);
			w.css({
				top : (OOlong.wh.height - app.height) / 2,
				left : (OOlong.wh.width - app.width) / 2
			}).find('.win_content').css({
				height : app.height - 27,
				width : app.width - 2
			});
			OOlong.winDrag(w);
			OOlong.winHandle(w);
			$('.dock > .dock-container2').append(OOlong.format(OOlong.dock, app));
			OOlong.refreshDock();
		}
		OOlong.focusOn(w);
	});
}
/****************************************************
 * 窗体拖拽 *
 ----窗体不能超过屏幕
 ****************************************************
 */
OOlong.winDrag = function(obj) {
	//鼠标距控件左上角的相对位置
	var _x, _y;
	var isMoving = false;
	var hold = $('#hold');
	//确定遮罩层
	//--在火狐下直接绑定hold会出现无法移动的情况，不明白为什么
	var lay = ($.browser.msie) ? hold : $(window);

	obj.find(".win_title").bind("mousedown", function(e) {
		//阻止冒泡
		e.stopPropagation();
		OOlong.focusOn(obj);
		isMoving = true;

		//获得当前鼠标位置与窗体左上角间的距离
		_x = e.clientX - obj.offset().left;
		_y = e.clientY - obj.offset().top;

		lay.bind('mousemove', function(e) {
			hold.show();
			//阻止冒泡
			e.stopPropagation();
			if(isMoving) {

				// var wh = OOlong.wh;
				//移动时根据鼠标位置计算控件左上角的绝对位置
				var x = e.clientX - _x;
				var y = e.clientY - _y;

				/*以下操作为修正窗口超出显示范围的问题
				----也就是说窗口整体被强制固定在可见区
				*/
				//左端
				x = x < 0 ? 0 : x;
				//右端
				x = x > OOlong.wh.width - obj.width() ? OOlong.wh.width - obj.width() : x;
				//上端
				y = y < 0 ? 0 : y;
				//下端
				y = y > OOlong.wh.height - obj.height() ? OOlong.wh.height - obj.height() : y;

				//最终调整
				obj.css({
					top : y,
					left : x
				});
			}
		}).bind('mouseup', function(e) {
			//阻止冒泡
			e.stopPropagation();
			isMoving = false;
			$(this).unbind("mousemove");
			hold.hide();
		});
	});
}
/****************************************************
 * 窗体事件 *
 ----通过控制按钮的最小化，最大化，还原，关闭
 ----双击窗体时最大化或者还原
 ****************************************************
 */
OOlong.winHandle = function(obj) {
	//最小化
	obj.find($('.min')).bind('mousedown', function(e) {
		//阻止冒泡
		e.stopPropagation();
		obj.fadeOut("fast");
	});
	//最大化
	obj.find($('.max')).bind('mousedown', function(e) {
		//阻止冒泡
		e.stopPropagation();
		OOlong.focusOn(obj);
		$(this).hide().next(".revert").show();
		obj.css({
			"z-index" : 10002
		}).animate({
			top : 0,
			left : 0,
			width : OOlong.wh.width,
			height : OOlong.wh.height
		}, "normal").find('.win_content').css({
			height : OOlong.wh.height - 25,
			width : OOlong.wh.width - 2
		}).focus();
	});
	//恢复
	obj.find($('.revert')).bind('mousedown', function(e) {
		//阻止冒泡
		e.stopPropagation();
		$(this).hide().prev(".max").show();
		var app = OOlong.findApp($(this).attr('id').slice(0, -1));
		obj.css({
			"z-index" : 1002
		}).animate({
			top : (OOlong.wh.height - app.height) / 2,
			left : (OOlong.wh.width - app.width) / 2,
			width : app.width + "px",
			height : app.height + "px"
		}, "normal").find('.win_content').animate({
			height : app.height - 25,
			width : app.width - 2
		}).focus();
	});
	//双击
	obj.find($('.win_title')).bind('dblclick', function(e) {
		if($(this).find('.max').is(':visible')) {
			$(this).find('.max').mousedown();
		} else {
			$(this).find('.revert').mousedown();
		}
	}).find('.win_content').focus();
	//关闭
	obj.find($('.close')).bind('mousedown', function(e) {
		//阻止冒泡
		e.stopPropagation();
		obj.html('').remove();
		$('#dock2').find('#' + obj.attr('id') + 'd').remove();
		OOlong.refreshDock();
	});
	//点击内容区，获得焦点
	// obj.find($('.win_content')).bind('click', function(e) {
	// //阻止冒泡
	// e.stopPropagation();
	// alert("sssss");
	// OOlong.focusOn(obj);
	// }).focus();
}
/****************************************************
 * 初始化右上快捷方式 *
 ----点击“桌面”：全部窗体隐藏
 ****************************************************
 */
OOlong.initNav = function() {
	/*右上快捷栏的初始化及事件绑定*/
	var d = 500;
	$('#navigation a').each(function() {
		$(this).stop().animate({
			'marginTop' : '-80px'
		}, d += 150);
	});
	$('#navigation > li').hover(function() {
		$('a', $(this)).stop().animate({
			'marginTop' : '-2px'
		}, 200);
	}, function() {
		$('a', $(this)).stop().animate({
			'marginTop' : '-80px'
		}, 200);
	});
	var nav = $('#navigation');
	nav.find('.desktop').bind('click', function(e) {
		//阻止冒泡
		e.stopPropagation();
		$('.window').hide();
		$('.win_current').hide();
	});
	nav.find('.about').bind('click', function(e) {
		e.stopPropagation();
		OOlong.alert("<strong>谨以此网站纪念乔布斯先生，你带给我的远比我得到的还要多。</strong><br />献给那些发疯得以为自己能改变世界的人，因为就是他们确实改变了这个世界。<br />内核使用自己写的OOlong(乌龙),当前版本1.11<br />模仿Mac的风格，花了4天成形，然后不断的增改，欢迎讨论和这个有关的问题。<br /><br /><br />QQ：361508376<br />新浪微博：失明的色盲<br />邮箱：fordewey@126.com", {
			"title" : "关于应用花境和我",
			"shadow" : true,
			"height" : 300
		});
	});
	nav.find('.comment').bind('click', function(e) {
		e.stopPropagation();
		OOlong.alert("目前不支持该功能，找到合适服务器再说");
	});
	nav.find('.shutdown').bind('click', function(e) {
		e.stopPropagation();
		OOlong.alert("为退出登录预留的位置，功能待完善");
	});
}
/****************************************************
 * 更新dock *
 ----如果当前没有元素，则将背景隐藏
 ****************************************************
 */
OOlong.refreshDock = function() {
	var con = $('#dock2').Fisheye({
		maxWidth : 60,
		items : 'a',
		itemsText : 'span',
		container : '.dock-container2',
		itemWidth : 40,
		proximity : 80,
		alignment : 'left',
		valign : 'bottom',
		halign : 'center'
	}).find('.dock-container2'); con.find('.dock-item2').length > 0 ? con.show() : con.hide();
}
/****************************************************
 * dock点击事件 *
 ----窗体弹出，获得焦点
 ****************************************************
 */
OOlong.dockClick = function(obj) {
	obj.find('.dock-container2').find('.dock-item2').live('click', function(e) {
		//阻止冒泡
		e.stopPropagation();
		var win = $('#' + $(this).attr('id').slice(0, -1));
		if(win.is(':visible')) {
			if(win.attr('class') == "win_current") {
				win.fadeOut("fast");
				//如果是焦点窗体则隐藏
			} else {
				OOlong.focusOn(win);
				//如果非焦点窗体则置为焦点
			}
		} else {
			win.fadeIn("normal");
			OOlong.focusOn(win);
		}
	});
}
/****************************************************
 * 从cookie获得背景图片名 *
 ----找到了即返回该字串
 ----为找到则返回default.jpg
 ****************************************************
 */
OOlong.getBGformCookie = function() {
	var arr = document.cookie.match(new RegExp("(^| )bg=([^;]*)(;|$)"));
	if(arr == null) {
		return "./wallpapers/default.jpg";
	} else {
		return unescape(arr[2]);
	}
}
/****************************************************
 * 设定起始页背景 *
 ----同时将更改写入cookie中
 ****************************************************
 */
OOlong.setBG = function(src) {
	//此 cookie 将被保存 30 天
	var Days = 30;
	var exp = new Date();
	exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
	$('#background').attr('src', src);
	document.cookie = "bg=" + escape(src) + ";expires=" + exp.toGMTString();
}
/****************************************************
 * 根据id获得在OOlong.apps中的对象 *
 ****************************************************
 */
OOlong.findApp = function(id) {
	for(var i = 0; i < OOlong.apps.length; i++) {
		if(OOlong.apps[i].id == id) {
			return OOlong.apps[i];
		}
	}
}
/****************************************************
 * 将窗体设为焦点 *
 ****************************************************
 */
OOlong.focusOn = function(obj) {
	$(".win_current").removeClass().addClass('window');
	obj.removeClass().addClass('win_current');
}
/****************************************************
 * 设定窗口以全屏打开 *
 ----在iframe中可通过：parent.OOlong.resizePage(400,400,0);来调用
 ****************************************************
 */
OOlong.fullSizePage = function(id) {
	$('#' + id).find('.win_handle').find('.max').mousedown();
}
/****************************************************
 * 依据JSON数据格式化模板元素 *
 ****************************************************
 */
OOlong.format = function(str, model) {
	for(var k in model) {
		var re = new RegExp("{" + k + "}", "g");
		str = str.replace(re, model[k]);
	}
	return str;
}
/****************************************************
 * 弹出对话框 *
 ----str: 要显示的信息
 ----json: 对话框的初始话信息
 >>>>>>>使用方法
 * OOlong.alert("要强调的文本信息",
 * {  //可选信息
 *  "title": "标题头",
 *  "shadow": true,              //默认为false，有无背景层
 *  "button": false,             //默认情况下为true，是否显示确定按钮
 *  "position": [400,80],        //分别为top，left值，设定窗口出现位置
 *  "onClose": function() {},    //窗口关闭时执行的函数
 *  "last" : 2000,               //窗口出现多长时间
 *  "dimByMouse": true,          //鼠标移过是否模糊
 *  "height": 800                //窗体高度，因为某些时候对高度控制的算法不乐观
 * });
 ----很奇怪的事情，win下需要对窗体进行必要的初始化操作
 ------
 ****************************************************
 */
OOlong.alert = function(str, json) {
	var mb = OOlong.getMB();
	var bg = $('.mb_BG');
	var mesbox = $('.messagebox').clearQueue();
	//此处
	var height = parseInt(str.length / 22 + 2) * 45;
	var hasTilte = false;
	//设置默认情况的表现
	mesbox.css({
		top : (OOlong.wh.height - mesbox.height() - 100) / 2,
		left : (OOlong.wh.width - mesbox.width()) / 2
	}).find('.mb_title').hide();
	var btn = mb.find('.mb_button').bind('click', function(e) {
		e.stopPropagation();
		if(bg.is(':visible')) {
			bg.clearQueue().fadeOut("fast");
		};
		mesbox.clearQueue().animate({
			left : OOlong.wh.width + 10
		}, "fast");
		$('html').unbind('keydown');
	}).css({
		left : mesbox.width() - 90
	}).show().focus();
	$('html').bind('keydown', function(e) {
		if(e.keyCode == 32 || e.keyCode == 13) {
			btn.click();
		}
	});
	mesbox.unbind('hover');

	if(json) {
		var opts = eval(json);
		if(opts["title"]) {
			mb.find('.mb_title').html(opts["title"]).show();
			hasTilte = true;
		}
		if(opts["shadow"]) {
			bg.fadeTo("fast", 0.6);
		}
		if(opts["position"]) {
			mesbox.css({
				top : opts["position"][0],
				left : opts["position"][1]
			});
		}
		if(opts["button"] == false) {
			mesbox.find('.mb_button').hide();
		}
		if(opts["onClose"]) {
			btn.bind('click', opts["onClose"]);
		}
		if(opts["dimByMouse"]) {
			mesbox.hover(function() {
				$(this).stop().fadeTo("normal", 0.7);
			}, function() {
				$(this).stop().fadeTo("normal", 1);
			});
		}
		if(opts["last"]) {
			$('html').unbind('keydown');
			mesbox.stop().delay(opts["last"]).fadeOut();
			if(bg.is(':visible')) {
				bg.delay(opts["last"]).stop().fadeOut();
			}
		}
		if(opts["height"]) {
			height = opts["height"];
		}
	}
	mb.find('.mb_content').html(str);
	mesbox.height(height + ( hasTilte ? 25 : 0)).show();
}
/****************************************************
 * 得到当前页面内的对话框元素 *
 ----有则返回，无则生成
 ****************************************************
 */
OOlong.getMB = function() {
	if(!OOlong.messagebox) {
		OOlong.messagebox = $("<div class='mb_BG'></div><div class='messagebox'><div class='mb_title'></div><div class='mb_content'></div><a href='#' class='mb_button'>确定</a></div>");
		$(document.body).append(OOlong.messagebox);
	}
	return OOlong.messagebox;
}
/****************************************************
 * 将检测浏览器环境 *
 ****************************************************
 */
OOlong.client = function() {
	var engine = {
		//呈现引擎
		ie : 0,
		gecko : 0,
		webkit : 0,
		khtml : 0,
		opera : 0,

		//具体版本号
		ver : null
	};

	var browser = {
		//浏览器
		ie : 0,
		firefox : 0,
		konq : 0,
		opera : 0,
		chrome : 0,
		safari : 0,

		//具体版本号
		ver : null,
	}

	var system = {
		win : false,
		mac : false,
		x11 : false, //Unix or Linux

		//移动设备
		iphone : false,
		ipod : false,
		nokiaN : false,
		winMobile : false,
		macMobile : false,

		//游戏系统
		wii : false,
		ps : false
	};

	var ua = navigator.userAgent;
	if(window.opera) {
		engine.ver = browser.ver = window.opera.version();
		engine.opera = browser.opera = parseFloat(engine.ver);
	} else if(/AppleWebKit\/(\S+)/.test(ua)) {
		engine.ver = RegExp["$1"];
		engine.webkit = parseFloat(engine.ver);

		if(/chrome\/(\S+)/.test(ua)) {
			browser.ver = RegExp["$1"];
			browser.chrome = parseFloat(browser.ver);
		} else if(/Version\/(S+)/.test(ua)) {
			browser.ver = RegExp["$1"];
			browser.safari = parseFloat(browser.ver);
		} else {
			//近似确定版本号
			var safariVersion = 1;
			if(engine.webkit < 100) {
				safariVersion = 1;
			} else if(engine.webkit < 312) {
				safariVersion = 1.2;
			} else if(engine.webkit < 412) {
				safariVersion = 1.3;
			} else {
				safariVersion = 2;
			}

			browser.safari = browser.ver = safariVersion;
		}
	} else if(/KHTML\/(\S+)/.test(ua) || /Konqueror\/([^;]+)/.test(ua)) {
		engine.ver = browser.ver = RegExp["$1"];
		engine.khtml = engine.konq = parseFloat(engine.ver);
	} else if(/rv:([^\)]+)\) Gecko\/\d{8}/.test(ua)) {
		engine.ver = RegExp["$1"];
		engine.gecko = parseFloat(engine.ver);

		if(/Firefox\/(\S+)/.test(ua)) {
			browser.ver = RegExp["$1"];
			browser.firefox = parseFloat(browser.ver);
		}
	} else if(/MSIE([^;]+)/.test(ua)) {
		engine.ver = browser.ver = RegExp["$1"];
		engine.ie = browser.ie = parseFloat(engine.ver);
	}

	browser.ie = engine.ie;
	browser.opera = engine.opera;

	//检测平台
	var p = navigator.platform;
	system.win = p.indexOf("Win") == 0;
	system.mac = p.indexOf("Mac") == 0;
	system.x11 = (p == "X11") || (p.indexOf("Linux") == 0);

	//检测Windows OS
	if(system.win) {
		if(/Win(?:dows)?([^do]{2})\s?(\d+\.\d+)?/.test(ua)) {
			if(RegExp["$1"] == "NT") {
				switch(RegExp["$2"]) {
					case "5.0":
						system.win = "2000";
						break;
					case "5.1":
						system.win = "XP";
						break;
					case "6.0":
						system.win = "Vista";
						break;
					case "6.1":
						system.win = "Win7";
						break;
					default:
						system.win = "NT";
						break;
				}
			} else if(RegExp["$1"] == "9x") {
				system.win = "ME";
			} else {
				system.win = RegExp["$1"];
			}
		}
	}

	//移动设备
	system.iphone = ua.indexOf("iPhone") > -1;
	system.ipod = ua.indexOf("iPod") > -1;
	system.nokiaN = ua.indexOf("NokiaN") > -1;
	system.winMobile = (system.win == "CE");
	system.macMobile = (system.iphone || system.ipod);

	//游戏设备
	system.wii = ua.indexOf("Wii") > -1;
	system.ps = /playstation/i.test(ua);

	return {
		engine : engine,
		browser : browser,
		system : system
	};
}
/*===================================================
* 以下内容为开放的API *
----在iframe中实际上通过：parent.OOlong.XXX（xx,xx）来实现
*===================================================
*/
/****************************************************
 * 设定背景图 *
 ****************************************************
 */
OOlong.iSetBackGround = function(src) {
	parent.OOlong.setBG(src);
}
/****************************************************
 * 设定打开窗口的大小 *
 ----在iframe中可通过：parent.OOlong.resizePage(400,400,0);来调用
 ****************************************************
 */
OOlong.iStartWithFullSize = function(id) {
	parent.OOlong.fullSizePage(id);
}
/****************************************************
 * 弹出对话框 *
 ****************************************************
 */
OOlong.iAlert = function(str, json) {
	parent.OOlong.alert(str, json);
}