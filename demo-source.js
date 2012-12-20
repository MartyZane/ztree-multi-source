var treeSetting = {
	changeRoot: true,//自动替代初始化的节点
	dataProxys: {
		organization: {
			treeNodeKey: "id",
			nameKey: "name",
			dataType: "all",
			url:"tree/data/organization.so",
			conditions:[],
			sortType:"asc",
			sortField:"name"
		},
		employee: {
			treeNodeKey: "id",
			nameKey: "personName",
			dataType: "all",
			url:"tree/data/warehouse.so",
			conditions:[],
			sortType:"desc",
			sortField:"personName",
			nameFormatter: function(name, node){
				return "员工：" + name;
			},
			titleFormatter: function(title, node){
				return "现在查看的是：" + title
			}
		},
		role: {
			treeNodeKey: "id",
			nameKey: "roleName",
			dataType: "all",
			url:"tree/data/role.so",
			conditions:[],
			sortType:"desc",
			sortField:"id",
			nameFormatter: function(name, node){
				return "角色：" + name;
			},
			titleFormatter: function(title, node){
				return "现在查看的是：" + title
			}
		},
	},
	dataProxySelecter:function(proxyName,node){
		if(proxyName == "organization"){//点击张开单位节点
			return ["employee", "role"];//去加载员工和角色
		}else if(proxyName == "employee"){
			return "role";//只加载角色
		}
		return "organization"; //点击根节点的情况
	},
	isLeaf: function(node){//是否是叶节点，不写则所有的节点都为非叶节点
		if(proxyName == "organization" || proxyName == "employee"){//加载单位和员工的节点
			return false;//非叶节点
		}else if(proxyName == "role"){
			return true;
		}
		return false;//根节点
	},
	beforeLoad: function(node,curProxyName){//加载时的判断条件，每次加载前会调用
		if(!node.proxyName){//展开的是根节点
			return null;
		}
		if(node.proxyName == "organization"){//展开的是单位节点
			if(curProxyName == "employee"){//单位节点下加载员工节点
				return "org="+node["id"];
			}else{//单位节点下加载角色节点
				return "org1="+node["id"];
			}
		}else if(node.proxyName = "employee"){//展开员工节点
			return "owner="+node["id"];//查询员工下角色的查询条件
		}
		
	},
	callback:{
		onClick: function(event, treeId, treeNode){
			refresData(treeNode["id"]);
		}
	}
}

//初始化方法：
var treeObj = $so_tree.init($("#tree"), treeSetting, {id:"root_0", name:"全部仓库", open:true, isParent: true});
var otRoot = treeObj.getNodes()[0];
treeObj.expandNode(otRoot, true);//张开第一个节点