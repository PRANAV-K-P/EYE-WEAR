var express = require('express');
const { response, resource } = require('../app');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
var userHelper=require('../helpers/user-helpers')
var Handlebars = require('handlebars');
const multer  = require('multer')
const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/product-images')
    },
    filename: function (req, file, cb) {
       
      cb(null,Date.now() + '-' +file.originalname)
    }
  })
const upload = multer({ storage: multerStorage })

const verifyAdminLogin=(req,res,next)=>{
  if (req.session.logIn) {
    next()
  }else{
    res.redirect('/admin')
  }
}
router.get('/',(req, res)=>{
  if (req.session.logIn) {
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin/adminlogin",{log:true,logErr: req.session.logErr});   
    req.session.logErr = false;
  }
});

router.post('/',(req,res)=>{
  userHelper.doAdminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.logIn = true;  
      req.session.admin = response.admin;
      res.redirect("/admin/dashboard");
    } else {
      req.session.logErr = "Enter valid username and password";
      res.redirect("/admin");
    }
  });
})

router.get('/adminproducts',verifyAdminLogin,async(req,res)=>{
  const perPage = 5;
  let pageNum;
  let skip;
  let productCount;
  let pages;
  pageNum = parseInt(req.query.page);
  skip = (pageNum - 1) * perPage
  await productHelper.getProductCount().then((count) => {
    productCount = count;
  })
  pages = Math.ceil(productCount / perPage)
  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });
  productHelper.getPaginatedProducts(skip,perPage).then((products)=>{
    res.render('admin/adminproducts',{layout:'adminlayout',products,currentPage: pageNum, pages: pages})
  })
  .catch(()=>{
    res.render('admin/adminproducts',{layout:'adminlayout'})
  })
})

router.get('/add-products',verifyAdminLogin,(req,res)=>{
  productHelper.getAllCategory().then((AllCategory)=>{
   res.render('admin/add-products',{layout:'adminlayout',modelErr:req.session.modelErr,AllCategory})
   req.session.modelErr=null
  })
})

router.post('/add-products',upload.fields([{name:'image1',maxCount: 1},{name:'image2',maxCount: 1}]),(req,res)=>{
  req.body.image1=req.files.image1[0].filename
  req.body.image2=req.files.image2[0].filename
  productHelper.addProduct(req.body).then((id)=>{
    if(id.exist){
      req.session.modelErr="Model already exist"
      res.redirect('/admin/add-products')
    }else{
      res.redirect('/admin/adminproducts')
    }
  })
})

router.post('/delete-product',(req,res)=>{
    let productId=req.body.product
    productHelper.deleteProduct(productId).then((response)=>{
      res.json(response)
    })
})

router.post('/delete-category-product',(req,res)=>{
    let productId=req.body.product
    productHelper.deleteProduct(productId).then((response)=>{
      res.json(response)
    })
}) 

router.get('/edit-product/:id',verifyAdminLogin,(req,res)=>{
  productHelper.getAllCategory().then((AllCategory)=>{
       productHelper.getProductDetails(req.params.id).then((product)=>{  
        res.render("admin/edit-product", { product, layout:'adminlayout',AllCategory}); 
      })

  })

})
router.post("/edit-product/:id",upload.fields([{name:'image1',maxCount: 1},{name:'image2',maxCount: 1}]),async(req, res) => {
  if(req.files.image1==null){
    Image1=await productHelper.fetchImage1(req.params.id)
  }else{
    Image1=req.files.image1[0].filename
  }
  if(req.files.image2==null){
    Image2=await productHelper.fetchImage2(req.params.id)
  }else{
    Image2=req.files.image2[0].filename
  }
  req.body.image1=Image1
  req.body.image2=Image2
  productHelper.updateProduct(req.params.id,req.body).then(() => {
    res.redirect("/admin/adminproducts"); 
  })
})

router.get('/edit-category-product/:id',verifyAdminLogin,(req,res)=>{
  productHelper.getAllCategory().then((AllCategory)=>{
       productHelper.getProductDetails(req.params.id).then((product)=>{  
        res.render("admin/edit-categoryproduct", { product, layout:'adminlayout',AllCategory}); 
      })

  })
})
router.post("/edit-category-product/:id",upload.fields([{name:'image1',maxCount: 1},{name:'image2',maxCount: 1}]),async(req, res) => {
  if(req.files.image1==null){
    Image1=await productHelper.fetchImage1(req.params.id)
  }else{
    Image1=req.files.image1[0].filename
  }

  if(req.files.image2==null){
    Image2=await productHelper.fetchImage2(req.params.id)
  }else{
    Image2=req.files.image2[0].filename
  }
  req.body.image1=Image1
  req.body.image2=Image2
  CatName=req.session.CatName
  productHelper.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/list-cat-products/'+CatName)
  })
})


router.get('/view-users',verifyAdminLogin,async(req,res)=>{
  const perPage = 5;
  let pageNum;
  let skip;
  let userCount;
  let pages;
  pageNum = parseInt(req.query.page);
  skip = (pageNum - 1) * perPage
  await userHelper.getUserCount().then((count) => {
    userCount = count;
  })
  pages = Math.ceil(userCount / perPage)
  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });
    userHelper.getPaginatedUsers(skip,perPage).then((users) => {
      res.render('admin/view-users', { layout:'adminlayout', users,currentPage: pageNum, pages: pages});    
    })
    .catch(()=>{
      res.render('admin/view-users', { layout:'adminlayout'})
    })
})

router.post('/user-blocked',verifyAdminLogin,(req,res)=>{   
    userHelper.blockUser(req.body.userId).then((response)=>{
      req.session.BError=true   
      req.session.user=null
      req.session.loggedIn = false;
      res.json(response)
    })
})

router.post('/user-unblocked',verifyAdminLogin,(req,res)=>{
    userHelper.unblockUser(req.body.userId).then((response)=>{
      res.json(response)
    })
  
})

router.get('/admin-category',verifyAdminLogin,(req,res)=>{
  productHelper.getAllCategory().then((cate)=>{
    res.render('admin/admin-category',{layout:'adminlayout',cate})
  })

})
router.get('/add-category',verifyAdminLogin,(req,res)=>{
  res.render('admin/add-category',{layout:'adminlayout',CatErr:req.session.CatErr})
  req.session.CatErr=null
})
router.post('/add-category',(req,res)=>{
  productHelper.addCategory(req.body).then((id)=>{
    if(id.exist){
      req.session.CatErr="Category already exist"
      res.redirect('/admin/add-category')
    }else{
      res.redirect('/admin/admin-category')
    }
    
  })
})
router.post('/delete-category',(req,res)=>{
  let categoryId=req.body.categoryId
  let categoryName=req.body.categoryName
  productHelper.checkProductCategory(categoryName).then((response)=>{
    if(response.stopCategoryDelete){
      res.json(response)
    }else{
      productHelper.deleteCategory(categoryId).then((response)=>{
        res.json(response)
      })
    }
  })
})

router.get('/edit-category/:cat',verifyAdminLogin,async (req,res)=>{
    categoryName=req.params.cat
    res.render("admin/edit-category", { categoryName, layout:'adminlayout' ,CatErr:req.session.CatErr});
    req.session.CatErr=null
})

router.post('/edit-category/:cat',async (req,res)=>{
  CatName=req.params.cat
  productHelper.updateCategory(req.params.cat, req.body).then((data) => {
    if(data.exist){
      req.session.CatErr="Category already exist"
      res.redirect('/admin/edit-category/'+CatName)
    }else{
      productHelper.categoryInProduct(req.params.cat, req.body).then(()=>{
        res.redirect('/admin/admin-category');
      })
    }
  })
})

router.get('/list-cat-products/:cat',verifyAdminLogin,async(req,res)=>{
  let categoryName=req.params.cat
  req.session.CatName=categoryName
  const perPage = 5;
  let pageNum;
  let skip;
  let catProductCount;
  let pages;
  pageNum = parseInt(req.query.page);
  skip = (pageNum - 1) * perPage
  await productHelper.getCategoryProductCount(categoryName).then((count) => {
    catProductCount = count;
  })
  pages = Math.ceil(catProductCount / perPage)
  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });
    productHelper.getProductsInCategory(categoryName,skip,perPage).then((products)=>{
      res.render('admin/list-cat-products',{layout:'adminlayout',products,categoryName,currentPage: pageNum, pages: pages})
    })
})

router.get('/add-categoryproduct/:cate',verifyAdminLogin,(req,res)=>{
  let categoryName=req.params.cate
    res.render('admin/add-categoryproduct',{layout:'adminlayout',categoryName,modelErr:req.session.modelErr})
    req.session.modelErr=null
})

router.post('/add-categoryproduct/:cat',upload.fields([{name:'image1',maxCount: 1},{name:'image2',maxCount: 1}]),(req,res)=>{
  req.body.image1=req.files.image1[0].filename
  req.body.image2=req.files.image2[0].filename
  let categoryName=req.params.cat
  productHelper.addProduct(req.body).then((id)=>{
    if(id.exist){
      req.session.modelErr="Model already exist"
      res.redirect('/admin/add-categoryproduct/'+categoryName)    
    }else{
      res.redirect('/admin/list-cat-products/'+categoryName)
    }
  })
})

router.get('/orders',verifyAdminLogin,async(req,res)=>{
  const perPage = 5;
  let pageNum;
  let skip;
  let orderCount;
  let pages;
  pageNum = parseInt(req.query.page);
  skip = (pageNum - 1) * perPage
  await userHelper.getOrderCount().then((count) => {
    orderCount = count;
  })
  pages = Math.ceil(orderCount / perPage)
  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });
    userHelper.getPaginatedCustomOrdersList(skip,perPage).then((order)=>{
      res.render('admin/orders',{layout:'adminlayout',order,currentPage: pageNum, pages: pages})
    })
})

router.post('/change-order-status',(req,res)=>{
  userHelper.changeOrderStatus(req.body).then((response)=>{
    res.json(response)
  })
})
router.get('/dashboard',verifyAdminLogin,async(req,res)=>{
  const perPage = 6;
  let pageNum;
  let skip;
  let orderCount;
  let pages;
  pageNum = parseInt(req.query.page);
  skip = (pageNum - 1) * perPage
  await userHelper.getOrderCount().then((count) => {
    orderCount = count;
  })
  pages = Math.ceil(orderCount / perPage)

  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });
  let salesData=await userHelper.fetchYearAndMonthSale()
  let monthSale=salesData.monthSale
  let yearSale=salesData.yearSale
  let userCount= await userHelper.fetchUserCount()
  let NoOfOrders= await userHelper.fetchNoOfOrders()
  let data=await userHelper.allCount()
  let deliveredCount=data.deliveredCount
  let cancelledCount=data.cancelledCount
  let placedCount=data.placedCount
  let returnedCount=data.returnedCount
  let sales=await userHelper.fetchSales()
  let monthNames=await userHelper.fetchMonth()
  await userHelper.getPaginatedCustomOrdersList(skip, perPage).then(async(orderList) => {
    res.render('admin/dashboard',{
      layout:'adminlayout',
      userCount,
      NoOfOrders,
      deliveredCount,
      cancelledCount,
      placedCount,
      returnedCount,
      sales,
      monthNames,
      monthSale,
      yearSale,
      orderList,
      currentPage: pageNum,
      pages: pages
    })
  })
})

router.get('/view-userorder-details/:id',verifyAdminLogin,async(req,res)=>{
  let orders=await userHelper.getDetailsOfOrderedProducts(req.params.id)
  let orderData=await userHelper.getOrderAddressDetails(req.params.id)
  res.render('admin/ordered-products',{layout:'adminlayout',orders,orderData})
})

router.get('/coupon',verifyAdminLogin,async(req,res)=>{
  const perPage = 2;
  let pageNum;
  let skip;
  let couponCount;
  let pages;
  pageNum = parseInt(req.query.page);
  skip = (pageNum - 1) * perPage
  await userHelper.getCouponCount().then((count) => {
    couponCount = count;
  })
  pages = Math.ceil(couponCount / perPage)
  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });
  let coupon=await userHelper.getPaginatedCoupon(skip,perPage)
  res.render('admin/coupon',{layout:'adminlayout',coupon,currentPage: pageNum, pages: pages})
})
router.post('/coupon',(req,res)=>{
  userHelper.createCoupon(req.body).then((response)=>{
    if(response.couponExist){
      res.json(response)
    }else{
      res.json(response)
    }
  })
})
router.post('/remove-coupon',(req,res)=>{
  couponId=req.body.coupon
  userHelper.removeCoupon(couponId).then((response)=>{
    res.json(response)
  })
 
})
router.get('/offer',verifyAdminLogin,async(req,res)=>{
  const perPage = 4;
  let pageNum;
  let skip;
  let productCount;
  let pages;
  pageNum = parseInt(req.query.page);
  skip = (pageNum - 1) * perPage
  await productHelper.getProductCount().then((count) => {
    productCount = count;
  })
  pages = Math.ceil(productCount / perPage)
  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });
  let categoryOffer=await userHelper.getCategoryOffer()
  let productOffer=await userHelper.getProductOffer()
  productHelper.getAllCategory().then((AllCategory)=>{ 
    productHelper.getPaginatedProducts(skip,perPage).then((products)=>{
      res.render('admin/offer',{layout:'adminlayout',AllCategory,categoryOffer,productOffer,products,currentPage: pageNum, pages: pages})
    }).catch(()=>{
      res.render('admin/offer',{layout:'adminlayout',AllCategory})
    }) 
  })
})
router.post('/category-offer',(req,res)=>{
  userHelper.createCategoryOffer(req.body).then((response)=>{
     if(response.offerNameExist){
       res.json(response)
     }else if(response.categoryOfferExist){
      res.json(response)
     }else{
       res.json(response)
     }

  })
})
router.post('/product-offer',(req,res)=>{
  userHelper.createProductOffer(req.body).then((response)=>{
    if(response.productOfferExist){
      res.json(response)
     }else{
       res.json(response)
     }
  })
})
router.post('/remove-category-offer',(req,res)=>{
  userHelper.removeCategoryOffer(req.body).then((response)=>{
    res.json(response)
  })
})
router.post('/remove-product-offer',(req,res)=>{
  userHelper.removeProductOffer(req.body).then((response)=>{
    res.json(response)
  })
})
router.post('/apply-product-offer',(req,res)=>{
  userHelper.applyProductOffer(req.body).then((response)=>{
    res.json(response)
  })
})
router.get('/single-order-details/:id',verifyAdminLogin,async(req,res)=>{
  let pending
  let placed
  let shipped
  let delivered
  let cancelled
  let returned
  let orders=await userHelper.getDetailsOfOrderedProducts(req.params.id)
  let orderData=await userHelper.getOrderAddressDetails(req.params.id)
  if(orderData.status==='Pending'){
    pending=true
  }else if(orderData.status==='Placed'){
    pending=true
    placed=true
  }else if(orderData.status==='Shipped'){
    pending=true
    placed=true
    shipped=true
  }else if(orderData.status==='Delivered'){
    pending=true
    placed=true
    shipped=true
    delivered=true
  }else if(orderData.status==='Cancelled'){
    cancelled=true
  }else if(orderData.status==='Returned'){
    returned=true
  }
  res.render('admin/single-order-details',{
    layout:'adminlayout',
    orders,
    orderData,
    pending,
    placed,
    shipped,
    delivered,
    cancelled,
    returned
  })
})
router.get('/product-data/:id',verifyAdminLogin,(req,res)=>{
  productHelper.getProductDetails(req.params.id).then((product)=>{  
    res.render("admin/product-data", { product, layout:'adminlayout'}); 
})
})

router.post('/adminlogout',(req,res)=>{
  req.session.admin=null
  req.session.logIn = false;
  res.redirect('/admin')
})

module.exports = router;
