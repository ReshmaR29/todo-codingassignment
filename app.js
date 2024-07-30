const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')

app = express()
app.use(express.json())

var db
const dbPath = path.join(__dirname, 'todoApplication.db')

const initializeDBAndServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })

  app.listen(3000, () => {
    console.log('server is up!!')
  })
}
initializeDBAndServer()

const isStatusValid = s => {
  return ['TO DO', 'IN PROGRESS', 'DONE'].includes(s)
}
const isPriorityValid = p => {
  return ['HIGH', 'LOW', 'MEDIUM'].includes(p)
}
const isCategoryValid = c => {
  return ['WORK', 'HOME', 'LEARNING'].includes(c)
}
const isDateValid = d => {
  return isValid(new Date(d))
}

app.get('/todos/', async (request, response) => {
  const {priority, status, category, search_q = ''} = request.query
  var getTodoQuery
  if (status !== undefined && !isStatusValid(status)) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (priority !== undefined && !isPriorityValid(priority)) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (category !== undefined && !isCategoryValid(category)) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else {
    if (status !== undefined && priority !== undefined) {
      getTodoQuery = `select * from todo 
             where priority='${priority}'
               and status='${status}'
               and todo like '%${search_q}%';`
    } else if (status !== undefined) {
      getTodoQuery = `select * from todo 
      where todo like '%${search_q}%'
   and status='${status}';`
    } else if (priority !== undefined) {
      getTodoQuery = `select * from todo 
               where priority='${priority}'
               and todo like '%${search_q}%';`
    } else if (category !== undefined && status !== undefined) {
      getTodoQuery = `select * from todo 
               where status='${status}'
               and category='${category}'
               and todo like '%${search_q}%';`
    } else if (category !== undefined && priority !== undefined) {
      getTodoQuery = `select * from todo 
               where priority='${priority}'
               and category='${category}'
               and todo like '%${search_q}%';`
    } else if (category !== undefined) {
      getTodoQuery = `select * from todo 
               where category='${category}'
               and todo like '%${search_q}%';`
    } else {
      getTodoQuery = `select * from todo 
               where todo like '%${search_q}%';`
    }

    const todoList = await db.all(getTodoQuery)
    response.send(
      todoList.map(todo => ({
        id: todo.id,
        todo: todo.todo,
        priority: todo.priority,
        status: todo.status,
        category: todo.category,
        dueDate: todo.due_date,
      })),
    )
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `select * from todo where id=${todoId};`
  const todoItem = await db.get(getTodoQuery)
  response.send({
    id: todoItem.id,
    todo: todoItem.todo,
    priority: todoItem.priority,
    status: todoItem.status,
    category: todoItem.category,
    dueDate: todoItem.due_date,
  })
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isDateValid(date) === true) {
    const getDueDateQuery = `select * from todo where due_date='${date}';`
    const todoList = await db.all(getDueDateQuery)
    response.send(
      todoList.map(todoItem => ({
        id: todoItem.id,
        todo: todoItem.todo,
        priority: todoItem.priority,
        status: todoItem.status,
        category: todoItem.category,
        dueDate: todoItem.due_date,
      })),
    )
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

let formattedDuedate
app.post('/todos/', async (request, response) => {
  const {id, status, priority, todo, category, dueDate} = request.body
  if (!isCategoryValid(category)) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (!isPriorityValid(priority)) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (!isStatusValid(status)) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (!isDateValid(dueDate)) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    formattedDuedate = format(new Date(dueDate), 'yyyy-MM-dd')
    const addTodoQuery = `insert into todo(id,todo,priority,status,category,due_date)
       values(${id},'${todo}','${priority}','${status}','${category}','${formattedDuedate}');`
    await db.run(addTodoQuery)
    response.send('Todo Successfully Added')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateTodoQuery = ''
  let responseTxt = ''

  if (requestBody.status !== undefined) {
    if (!isStatusValid(requestBody.status)) {
      response.status(400)
      response.send('Invalid Todo Status')
    } else {
      const {status} = requestBody
      updateTodoQuery = `update todo set status='${status}'
                              where id=${todoId};`
      responseTxt = 'Status Updated'
      await db.run(updateTodoQuery)
      response.send(responseTxt)
    }
  }
  if (requestBody.priority !== undefined) {
    if (!isPriorityValid(requestBody.priority)) {
      response.status(400)
      response.send('Invalid Todo Priority')
    } else {
      const {priority} = requestBody
      updateTodoQuery = `update todo set priority='${priority}'
                              where id=${todoId};`
      responseTxt = 'Priority Updated'
      await db.run(updateTodoQuery)
      response.send(responseTxt)
    }
  }
  if (requestBody.todo !== undefined) {
    const {todo} = requestBody
    updateTodoQuery = `update todo set todo='${todo}'
                              where id=${todoId};`
    responseTxt = 'Todo Updated'
    await db.run(updateTodoQuery)
    response.send(responseTxt)
  }
  if (requestBody.category !== undefined) {
    if (!isCategoryValid(requestBody.category)) {
      response.status(400)
      response.send('Invalid Todo Category')
    } else {
      const {category} = requestBody
      updateTodoQuery = `update todo set category='${category}'
                              where id=${todoId};`
      responseTxt = 'Category Updated'
      await db.run(updateTodoQuery)
      response.send(responseTxt)
    }
  }
  if (requestBody.dueDate !== undefined) {
    if (!isDateValid(requestBody.dueDate)) {
      response.status(400)
      response.send('Invalid Due Date')
    } else {
      const {dueDate} = requestBody
      formattedDuedate = format(new Date(dueDate), 'yyyy-MM-dd')
      updateTodoQuery = `update todo set due_date='${formattedDuedate}'
                              where id=${todoId};`
      responseTxt = 'Due Date Updated'
      await db.run(updateTodoQuery)
      response.send(responseTxt)
    }
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `delete from todo where id=${todoId};`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
