class Compile{
    //vm为MVVM类实例
    constructor(el,vm){
        this.el = this.isElementNode(el)?el:document.querySelector(el);
        this.vm = vm;
        if (this.el){
            //如果这个元素能获取到，才开始编译
            //1.先将真实的DOM移入到内存中以节省性能
            let fragment = this.node2fragment(this.el);
            //2.编译——>提取想要的元素节点 v-model 和文本节点 {{ }}
            this.compile(fragment);
            //3.把编译好的fragment塞回到页面中
            this.el.appendChild(fragment);
        }
    }

    /*辅助方法*/
    //判断是否是元素节点
    isElementNode(node){
        return node.nodeType === 1;
    }

    //是不是指令
    isDirective(name){
        return name.includes('v-');

    }

    /*核心方法*/
    //需要将el中的内容全部放到内存中
    node2fragment(el){
        //文档碎片 内存中的dom节点
        let fragment = document.createDocumentFragment();
        let firstChild;
        while(firstChild = el.firstChild){
            fragment.appendChild(firstChild);
        }

        //内存中的节点
        return fragment;

    }

    //编译
    compile(fragment){
        //因为只能拿到第一层子节点，所以需要递归
        let childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)){
                //是元素节点，这里需要编译元素
                this.compileElement(node);
                //是元素节点，还需要深入检查
                this.compile(node);
            }
            else{
                //是文本节点，这里需要编译文本
                this.compileText(node);
            }
        });
    }

    //编译元素
    compileElement(node){
        //带v-model v-text
        //取出当前节点的属性
        let attrs = node.attributes;
        Array.from(attrs).forEach(attr => {
            //判断属性名字是不是包含v-
            let attrName = attr.name;
            if (this.isDirective(attrName)){
                //取到对应的值放到节点中
                let expr = attr.value;
                let [,type] = attrName.split('-');
                //node this.vm.$data expr
                CompileUtil[type](node, this.vm, expr);


            }
        });


    }
    //编译文本
    compileText(node){
        //带{{ }}
        //取文本中的内容
        let expr = node.textContent;
        let reg = /\{\{([^}]+)\}\}/g;
        if (reg.test(expr)){
            //node this.vm.$data text
            CompileUtil['text'](node, this.vm, expr);
        }

    }
}

CompileUtil = {
    getVal(vm, expr){//获取实例上对应的数据
        expr = expr.split('.');//[a,v,c,s,a,w,r]
        return expr.reduce((prev, next) => {
            return prev[next];
        }, vm.$data);
    },
    getTextVal(vm, expr){//获取编译文本后的结果
        return  expr.replace(/\{\{([^}]+)\}\}/g, (...arguments)=>{
            return this.getVal(vm, arguments[1]);
        });
    },
    text(node, vm, expr){//文本处理
        let updateFn = this.updater['textUpdater'];
        //{{message.a}} => helloWorld
        let value = this.getTextVal(vm, expr);
        //{{a}},{{b}}
        expr.replace(/\{\{([^}]+)\}\}/g, (...arguments)=>{
            new Watcher(vm, arguments[1], (newValue) => {
                //如果数据变化了，文本节点需要重新获取依赖的数据更新文本中的内容
                updateFn && updateFn(node,this.getTextVal(vm, expr));
            });
        });
        updateFn && updateFn(node,value);

    },
    setVal(vm, expr, value){
        expr = expr.split('.');
        return expr.reduce((prev, next, currentIndex) => {
            if (currentIndex === expr.length - 1){
                return prev[next] = value;
            }
            return prev[next];
        },vm.$data);
    },
    model(node, vm, expr){//输入框处理
        let updateFn = this.updater['modelUpdater'];
        //监听数据变化
        new Watcher(vm, expr, (newValue) => {
            //当值变化后会调用cb， 将新的值传递过来（）
            updateFn && updateFn(node,this.getVal(vm, expr));
        })
        node.addEventListener('input',(e) => {
            let newValue = e.target.value;
            this.setVal(vm, expr, newValue);
        })
        updateFn && updateFn(node,this.getVal(vm, expr));
    },
    updater:{
        //文本更新
        textUpdater(node, value){
            node.textContent = value;
        },
        //输入框更新
        modelUpdater(node, value){
            node.value = value;
        }

    }
}

