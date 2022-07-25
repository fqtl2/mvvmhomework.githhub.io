class Observer{
    constructor(data){
        this.observe(data);
    }
    observe(data){
        //要对这个data数据将原有的属性改成set和get的形式
        //要保证data存在且为对象类型数据
        if (!data || typeof data !== 'object'){
            return;
        }
        //要将数据一一劫持，先获取到data的key和value
        //将data对象中的所有key取出放进一个数组
        Object.keys(data).forEach(key => {
           //劫持第一层数据
           this.defineReactive(data, key, data[key]);
           //深度递归劫持
           this.observe(data[key]);
        });

    }

    //定义响应式
    defineReactive(obj, key, value){
        let that = this;
        let dep = new Dep();//每个变化的数据都会对应一个数组，这个数组是存放所有更新的操作
        Object.defineProperty(obj, key, {
            enumerable:true,
            configurable:true,
            get(){//当取值时调用的方法
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set(newValue){//当给data属性中属性设置值的时候，更改获取的属性的值
                if (newValue != value){
                    that.observe(newValue);
                    value = newValue;
                    dep.notify();//通知所有人数据更新了
                }
            }
        })
    }
}

class Dep{
    constructor() {
        //订阅的数组
        this.subs = [];
    }
    addSub(watcher){
        this.subs.push(watcher);
    }
    notify(){
        this.subs.forEach(watcher => watcher.update());
    }
}