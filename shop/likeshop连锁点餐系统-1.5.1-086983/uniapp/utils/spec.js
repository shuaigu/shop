/**
 * @param { Object } arg 规格数据
 * @param { Object }  that 页面实例
 * @description 规格封装类（因为详情和规格选择组件都有用到这个所以封装起来）
 **/
export default class Spec {
    
    // 库存为0的
    outOfStock = []
    // 商品规格组合
    goodsItem = []
    
    constructor(arg, that) {
        // 商品组合映射
        this.goodsItem = arg.goods_item || [];
        
        // 页面规格与加料选择数据
        that.specList = arg.goods_spec_list || [];
        that.material = arg.goods_material || [];
        
        // 调用初始化
        this.init(that);
    }
    
    /**
     * @description 初始化
     **/
    init(that) {
        // // 找出库存为0的
        this.outOfStock = this.goodsItem.filter(item => item.stock === 0)

        // 找出库存不为0的
        const resultArr = this.goodsItem.filter(item => item.stock !== 0)
        if (resultArr.length != 0) {
            resultArr[0].spec_value_ids_arr = resultArr[0].spec_value_ids.split(',');
            that.checkedGoods = resultArr[0]
        } else {
            // 不能选择的
            this.goodsItem[0].spec_value_ids_arr = this.goodsItem[0].spec_value_ids.split(',');
            that.disable = this.goodsItem.map(item => item.spec_value_ids);
            that.checkedGoods = this.goodsItem[0]
        }
    }
    
    /**
     * @param { Object }  that 页面实例
     * @description 规格数据发生变化时触发校验规格
     **/
    changeSpecWatch(that) {
        if (that.checkedGoods.stock === 0) return

        let material = []
        that.material.forEach(item => {
            if (item.material) {
                const res = item.material.filter(specitem => specitem.checked === 1);
                if(res.length) material = [...material, ...res]
            }
        })
    
        // 当前选择的规格
        const res = this.goodsItem.filter(item => that.checkedGoods.spec_value_ids === item.spec_value_ids)
    
        // 当前选择的规格ids数组
        const idsArr = that.checkedGoods.spec_value_ids_arr;
        // 找出规格相同和规格不相同的余数
        const getArrGather = this.getArrResult(idsArr, this.outOfStock);
        // 计算出缺货的规格项
        that.disable = this.getOutOfStockArr(getArrGather, idsArr)
    
        if (res.length != 0) {
            let result = JSON.parse(JSON.stringify(res[0]))
            result.spec_value_ids_arr = result.spec_value_ids.split(',')
            result.material = material;
            that.checkedGoods = result;
        }
    }
    
    /**
     * @param { Object }  that 页面实例
     * @description 选择规格
     **/
    choseSpecItemFun(that, index, index2) {
        const id = that.specList[index].spec_value[index2].id;
    
        // 无法选择
        const disable = that.disable.filter(item => item == id)
        if (disable.length != 0) return
    
        let idsArr = that.checkedGoods.spec_value_ids_arr;
        if (id == idsArr[index]) idsArr[index] = ''
        else idsArr[index] = id;
        //保存已选规格
        that.checkedGoods.spec_value_ids_arr = idsArr;
        that.checkedGoods.spec_value_ids = idsArr.join(',');
        // 重新渲染页面
        that.specList = [...that.specList]
    }
    
    /**
     * @param { Object }  that 页面实例
     * @description 选择配料
     **/
    choseSpecItemMaterialFun(that, index, cIndex) {
        const checked = that.material[index].material[cIndex].checked == 1 ? 0 : 1;
    
        if (that.material[index].all_choice == 0) {
            that.material[index].material.forEach(item => item.checked = 0);
        }
        that.material[index].material[cIndex].checked = checked;
        that.material = [...that.material]
    }
    
    /**
     * @param { Number || String }  event id
     * @param { Object }  that 页面实例
     * @description 是否禁用当前规格
     **/
    isDisable(event, that) {
        const res = that.disable.filter(item => item === event)
        if (res.length != 0) return true
        else return false
    }
    
    /**
     * @param { Array }  arr 为下面getArrResult方法的返回值
     * @param { Array }  idsArr 当前选择的ids
     * @param { Array }  result 是一个存储的数组，默认是结果数组
     * @param { Array }  return id
     * @description 最终不可选择的数组ids
     **/
    getOutOfStockArr(arr, idsArr, result = []) {
        arr.forEach(el => {
            if (el.count >= (idsArr.length - 1)) 
                result = [...result, ...el.different]
        })
        return result
    }
    
    /**
     * @param { Array }  idsArr 当前选择的ids
     * @param { Array }  outOfStock 缺货的ids
     * @param { Array }  arr 是一个存储不同ids的数组，默认是空数组
     * @param { Number }  count 是一个存储的计数数量，默认是0
     * @param { Object }  return  存储计数的数字 和 存储不同ids的数组
     * @description 用于统计相同id出现次数 和 不同ids的数组
     **/
    getArrIdentical(idsArr, outOfStock, arr = [], count = 0) {
        idsArr.forEach(el => {
            outOfStock.forEach(el2 => {
                if (el == el2) {
                    count += 1;
                    arr.push(el)
                }
            })
        });
        return {
            count, //几个相同的
            different: this.getArrDifference([...new Set(arr)].map(Number), outOfStock.map(Number)),
        }
    }
    
    /**
     * @param { Array }  idsArr 当前选择的ids
     * @param { Array }  outOfStock 缺货的ids
     * @param { Array }  result 用于统计相同id出现次数 和 不同ids的数组
     * @param { Object }  return  返回相同以及不相同的id
     * @description 用于统计相同id出现次数 和 不同ids的数组
     **/
    getArrResult(idsArr, outOfStock, result = []) {
        outOfStock.forEach(item => {  
            const res = this.getArrIdentical(idsArr, item.spec_value_ids.split(','))
            if (res != undefined && res.length != 0) result = [...result, res]
        })
        return result
    }
    
    /**
     * @param { Array }  arr1 数组1
     * @param { Array }  arr2 数组2
     * @param { Object }  return  返回两个数组中不相同的值
     * @description 找出两个数组中参数不同的
     **/
    getArrDifference(arr1, arr2) {
        return arr1.concat(arr2).filter(function(v, i, arr) {
            return arr.indexOf(v) == arr.lastIndexOf(v);
        })
    }
}