/*
 * 名称：ztree-multi-source
 * 建议版本：ztree3.4版本
 * 开始时间：2012/9/20
 * 插件功能
 *  1.支持SpringMvc(这个是配合后台使用)
 *  2.支持多个数据混合使用
 *  3.支持对各种数据进行自定义
 * 升级说明:
 * 	支持zTree3.4
 * changelog:
 * 1.[2012-12-20]添加配置changeRoot，设置为true时第一次从后台加载的数据会替代原始根节点，如果之后的根节点只有1个则自动展开
 */
(function($){
	_mutliDataProxyHandler = function(proxys){
		var _proxys = tools.clone(proxys);
		//传入节点数据和proxy名称
		function getNodes(proxyName, data){
			var _index = $.inArray(proxyName, _proxys);
			if(_index != -1){
				_proxys[_index] = data;
			}
			
			var _nodes = [];
			while(_proxys.length > 0 && tools.isArray(_proxys[0])){
				$.merge(_nodes,_proxys.shift());
			}
			
			if(_nodes.length > 0){
				var _result = {success:false,nodes:_nodes};
				if(_proxys.length == 0){
					_result.success = true;
				}
				return _result;
			}else{
				return null;
			}
		}
		
		return getNodes;
	},
	_tools = {
		uniq : function() {  
	        var temp = {}, len = this.length;
	
	        for(var i=0; i < len; i++)  {  
	            if(typeof temp[this[i]] == "undefined") {
	                temp[this[i]] = 1;
	            }  
	        }  
	        this.length = 0;
	        len = 0;
	        for(var i in temp) {  
	            this[len++] = i;
	        }  
	        return this;  
	    }  
	},
	_view = {
		asyncNode: function(setting, node, isSilent, callback) {
			var i, l;
			if (node && !node.isParent) {
				tools.apply(callback);
				return false;
			} else if (node && node.isAjaxing) {
				return false;
			} else if (tools.apply(setting.callback.beforeAsync, [setting.treeId, node], true) == false) {
				tools.apply(callback);
				return false;
			}
			if (node) {
				node.isAjaxing = true;
				var icoObj = $("#" + node.tId + consts.id.ICON);
				icoObj.attr({"style":"", "class":"button ico_loading"});
			}

			var isJson = (setting.async.contentType == "application/json"), tmpParam = isJson ? "{" : "", jTemp="";
			for (i = 0, l = setting.async.autoParam.length; node && i < l; i++) {
				var pKey = setting.async.autoParam[i].split("="), spKey = pKey;
				if (pKey.length>1) {
					spKey = pKey[1];
					pKey = pKey[0];
				}
				if (isJson) {
					jTemp = (typeof node[pKey] == "string") ? '"' : '';
					tmpParam += '"' + spKey + ('":' + jTemp + node[pKey]).replace(/'/g,'\\\'') + jTemp + ',';
				} else {
					tmpParam += spKey + ("=" + node[pKey]).replace(/&/g,'%26') + "&";
				}
			}
			if (tools.isArray(setting.async.otherParam)) {
				for (i = 0, l = setting.async.otherParam.length; i < l; i += 2) {
					if (isJson) {
						jTemp = (typeof setting.async.otherParam[i + 1] == "string") ? '"' : '';
						tmpParam += '"' + setting.async.otherParam[i] + ('":' + jTemp + setting.async.otherParam[i + 1]).replace(/'/g,'\\\'') + jTemp + ",";
					} else {
						tmpParam += setting.async.otherParam[i] + ("=" + setting.async.otherParam[i + 1]).replace(/&/g,'%26') + "&";
					}
				}
			} else {
				for (var p in setting.async.otherParam) {
					if (isJson) {
						jTemp = (typeof setting.async.otherParam[p] == "string") ? '"' : '';
						tmpParam += '"' + p + ('":' + jTemp + setting.async.otherParam[p]).replace(/'/g,'\\\'') + jTemp + ",";
					} else {
						tmpParam += p + ("=" + setting.async.otherParam[p]).replace(/&/g,'%26') + "&";
					}
				}
			}
			if (tmpParam.length > 1) tmpParam = tmpParam.substring(0, tmpParam.length-1);
			if (isJson) tmpParam += "}";
			
			//插件代码---------------------------------
			//判断选择器
			if(!setting.dataProxySelecter){
				alert("Error:没有数据加载选择器");
				return;
			}
			//获取数据加载代理的名称
			var proxyNames = setting.dataProxySelecter(node.proxyName,node);
			if(proxyNames==undefined || proxyNames==null){
				alert("Error:数据加载选择器返回错误");
				return;
			}	
			
			if (!tools.isArray(proxyNames)) {//不是一个数组
				proxyNames = [proxyNames];
			}else{
				tools.uniq(proxyNames);//去掉重复的
			}
			
			//加载数据
			var proxy = null;
			if(proxyNames.length == 1){//单个数据
				proxy = setting.dataProxys[proxyNames[0]];
				view.dataLoader(proxy, proxyNames[0], null, setting, node, isSilent, callback);
			}else{
				var handler = new _mutliDataProxyHandler(proxyNames);
				$(proxyNames).each(function(index, curProxyName){
					proxy = setting.dataProxys[curProxyName];
					view.dataLoader(proxy, curProxyName, handler, setting, node, isSilent, callback);
				});
			}
			//ajax调用到下面dataLoader
			//插件代码结束------------------------------------------------------------------------------
			return true;
		},
		//数据加载器
		dataLoader: function(proxy, curProxyName, mutliDataProxyHandler, setting, node, isSilent, callback){
			if(proxy!=undefined && proxy!=null && proxy.url){
				//处理查询条件
				var conditions = proxy.conditions || [];
				if(!$.isArray(conditions)){
					conditions = [conditions];
				}
				//加载前处理用户自定义的查询条件
				if(setting.beforeLoad){
					var userCondition = setting.beforeLoad(node, curProxyName) || [];
					if(!$.isArray(conditions)){
						userCondition = [userCondition];
					}
					$.extend(conditions, userCondition);
				}
				
				var requestData = {
					sortField: proxy.sortField, 
					sortType: proxy.sortType,
					conditions: conditions,
					dataType: proxy.dataType
				};
				
				//执行数据加载
				$.ajax({
					url: proxy.url,
					type: "post",
					contentType: "application/json",
					dataType: "json",
					data: JSON.stringify(requestData),
					success: function(msg, message){
						//组织节点数据
						var newNodes = [];
						try {
							if (!msg || msg.length == 0) {
								newNodes = [];
							} else if (typeof msg == "string") {
								newNodes = eval("(" + msg + ")");
							} else {
								newNodes = msg;
							}
						} catch(err) {
							newNodes = msg;
						}
						
						if (node) {
							node.isAjaxing = null;
							node.zAsync = true;
						}
						
						//向节点加入扩展数据
						for (i = 0; i < newNodes.length; i++) {
							newNodes[i].proxyName = curProxyName;
							newNodes[i].nameKey = proxy.nameKey;//显示用的属性
							newNodes[i].titleKey = proxy.titleKey;//显示提示用的属性
							
							//判断是否是叶子节点
							if(setting.isLeaf){
								newNodes[i].isParent = !setting.isLeaf(newNodes[i]);
							}else{
								newNodes[i].isParent = true;
							}
						}
						//这里处理原来的根节点，将第一次加载的数据作为新的根节点
							if(setting.changeRoot && setting._root_flag == undefined){
								//删除原来的根节点
								view.removeNode(setting, node);
								node = null;
								setting._root_flag = true;
							}
						view.setNodeLineIcos(setting, node);
						if (newNodes && newNodes !== "") {
							newNodes = tools.apply(setting.async.dataFilter, [setting.treeId, node, newNodes], newNodes);
							view.addNodes(setting, node, !!newNodes ? tools.clone(newNodes) : [], !!isSilent);
						} else {
							view.addNodes(setting, node, [], !!isSilent);
						}
						setting.treeObj.trigger(consts.event.ASYNC_SUCCESS, [setting.treeId, node, msg]);
						tools.apply(callback);
						
						if(setting._root_flag){//这处理如果后面的根节点只有一个则自动展开
							var _tree = zt.getZTreeObj(setting.treeId);
							var _otRoots = _tree.getNodes();
							if(_otRoots.length == 1){
								//展开第一个
								_tree.expandNode(_otRoots[0], true);
							}
							setting._root_flag = false;
						}
					},
					error: function(XMLHttpRequest, textStatus, errorThrown) {
						if (node) node.isAjaxing = null;
						view.setNodeLineIcos(setting, node);
						setting.treeObj.trigger(consts.event.ASYNC_ERROR, [setting.treeId, node, XMLHttpRequest, textStatus, errorThrown]);
					}
				});
			}
		}
	}
		
	_data = {
		getNodeName: function(setting, node) {
			var nameKey = setting.data.key.name;
			return data._nameFormatter(setting, node, node.nameKey || nameKey);
		},
		getNodeTitle: function(setting, node) {
			var t = setting.data.key.title === "" ? setting.data.key.name : setting.data.key.title;
			return data._titleFormatter(setting, node, node.titleKey || t);
		},
		_nameFormatter: function(setting, node, nameKey){
			if(node.proxyName){
				var nf = setting.dataProxys[node.proxyName].nameFormatter;
				return typeof nf == 'function' ? nf(node[nameKey], node) : node[nameKey];
			}else{
				return node[nameKey];
			}
		},
		_titleFormatter: function(setting, node, titleKey){
			if(node.proxyName){
				var tf = setting.dataProxys[node.proxyName].titleFormatter;
				return typeof tf == 'function' ? tf(node[titleKey], node) : node[titleKey];
			}else{
				return node[titleKey];
			}
		}
	}
	_z = {
		tools: _tools,
		view: _view,
		data: _data
	};
	$.extend(true, $.fn.zTree._z, _z);

	var zt = $.fn.zTree,
	tools = zt._z.tools,
	consts = zt.consts,
	view = zt._z.view,
	data = zt._z.data,
	event = zt._z.event;

})(jQuery);