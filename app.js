const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')
const app = express()
app.use(express.json())
let db = null
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, 'todoApplication.db'),
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('server is running...')
    })
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

initializeDBandServer()

const outputResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', priority, status, category} = request.query
  switch (true) {
    case priority !== undefined && status !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `select *
                   from todo
                   where status='${status}' and priority='${priority}';`
          data = await db.all(getTodoQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case category !== undefined && status !== undefined:
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQuery = `select *
                   from  todo
                   where status='${status}' and category='${category}';`
          data = await db.all(getTodoQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case category !== undefined && priority !== undefined:
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQuery = `select *
                   from  todo
                   where priority='${priority}' and category='${category}';`
          data = await db.all(getTodoQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQuery = `select *
                   from  todo
                   where priority='${priority}';`
        data = await db.all(getTodoQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodoQuery = `select *
                   from todo
                   where status='${status}';`
        data = await db.all(getTodoQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case category !== undefined:
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        getTodoQuery = `select *
                   from todo
                   where category='${category}';`
        data = await db.all(getTodoQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodoQuery = `select *
         from todo 
         where todo like '%${search_q}%';`
      data = await db.all(getTodoQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `select *
         from todo
         where id=${todoId};`
  const data = await db.get(getTodoQuery)
  response.send(outputResult(data))
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    const getTodoQuery = `select * from todo where due_date='${newDate}';`
    const data = await db.all(getTodoQuery)
    response.send(data.map(eachData => outputResult(eachData)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'LEARNING' ||
        category === 'HOME'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newDueDate=format(new Date(dueDate),'yyyy-MM-dd')
          const createTodoQuery = `insert into todo
                              (id,todo,category,priority,status,due_date)
                              values('${id}','${todo}','${category}','${priority}','${status}','${newDueDate}');`

          await db.run(createTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {status, priority, category, todo, dueDate} = request.body
  let updateTodoQuery=""
  if (status !== undefined) {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      updateTodoQuery = `update todo
                   set status='${status}' where id='${todoId}'`
      await db.run(updateTodoQuery)
      response.send('Status Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else if (priority !== undefined) {
    if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
      updateTodoQuery = `update todo
                   set priority='${priority}' where id='${todoId}'`
      await db.run(updateTodoQuery)
      response.send('Priority Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else if (category !== undefined) {
    if (category === 'WORK' || category === 'LEARNING' || category === 'HOME') {
      updateTodoQuery = `update todo
                   set category='${category}' where id='${todoId}'`
      await db.run(updateTodoQuery)
      response.send('Category Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  } else if (dueDate !== undefined) {
    if (isMatch(dueDate, 'yyyy-MM-dd')) {
      updateTodoQuery = `update todo
                   set due_date='${dueDate}' where id='${todoId}'`
      await db.run(updateTodoQuery)
      response.send('Due Date Updated')
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  } else {
    updateTodoQuery = `update todo
                   set todo='${todo}' where id='${todoId}'`
    await db.run(updateTodoQuery)
    response.send('Todo Updated')
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `delete from todo where id='${todoId}'`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
