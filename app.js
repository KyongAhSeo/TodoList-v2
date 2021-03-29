//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
//1. mongoose 설치
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//2. 연결
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

//3. schema 생성
const itemsSchema = {
  name: String
};

//4. 모델 생성
                            //collection의 이름은 단수형태로
const Item = mongoose.model("Item", itemsSchema);

//5. default item 생성
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

//6. default item이 들어갈 array 생성
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  //8. find all documents
  //Item collection에 접근한다.
  //{} = Item collection에 들어가있는 모든 것을 찾으라는 의미
  //foundItems = 그 모든 것이 저장되는 변수
  //9. newListItems에 foundItems이 들어가도록 수정
  Item.find({}, function(err, foundItems){

    //foundItems에 데이터가 들어가 있는지 먼저 체크
    if(foundItems.length === 0){
      //7. 아무것도 없으면 데이터 삽입
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved default items to DB.");
        }
      });
      //루트 라우터로 다시 이동
      res.redirect("/");
      //foundItems에 데이터가 있으면
    } else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new List
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing List

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted the checked item.");
        res.redirect("/");
      };
    });
  }else{
    //먼저 List 컬렉션에서 findOneAndUpdate()을 이용하여 데이터를 찾아 삭제한다.
    //첫번째 인자에는 찾고자하는 list의 이름
    //두번째 인자에는 업데이트하고자 하는게 들어가는데 $pull을 사용하여 checkedItemId의 아이템을 items array에서 찾아 지울것이다.

    List.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
  });
}
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
