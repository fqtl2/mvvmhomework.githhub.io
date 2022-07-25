class MVVM{
    constructor(options) {
        //先把可用的方法挂载到实例上
        this.$el = options.el;
        this.$data = options.data;

        //如果有要编译的模板就开始编译
        if(this.$el){
            //数据劫持，将对象的所有属性改成get和set方法
            new Observer(this.$data);
            this.proxyData(this.$data);
            //用数据和元素进行编译
            new Compile(this.$el, this);
        }

    }

    // 把对象的属性全部绑定在实例上
    proxyData(data){
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                get(){
                    return data[key];
                },
                set(newValue){
                    data[key] = newValue;
                },
            });
        })
    }
}

