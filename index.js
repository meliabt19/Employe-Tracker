const mysql = require("mysql");
const inquirer = require("inquirer");

let connection = mysql.createConnection({
  host: "localhost",
  // Your port; if not 3306
  port: 3306,
  // Your username
  user: "root",
  // Your password
  password: "password",
  database: "employee_tracker",
});
connection.connect(function (err) {
  if (err) throw err;
  promptMode();
});

const promptMode = () => {
  inquirer
    .prompt([
      {
        type: "list",
        name: "PickMode",
        message: "What would you like to do?",
        choices: [
          "View Departments",
          "View Employees",
          "View Roles",
          "Add Department",
          "Add Role",
          "Add employee",
          "Update Roles",
          "Update Managers",
          "Exit",
        ],
      },
    ])
    .then(function (answers) {
      if (answers.PickMode === "View Departments") {
        viewDepartments();
      } else if (answers.PickMode === "View Employees") {
        viewEmployees();
      } else if (answers.PickMode === "View Roles") {
        viewRoles();
      } else if (answers.PickMode === "Add Department") {
        addDepartment();
      } else if (answers.PickMode === "Add Role") {
        addRole();
      } else if (answers.PickMode === "Add employee") {
        addEmployee();
      } else if (answers.PickMode === "Update Roles") {
        updateEmployee();
      } else if (answers.PickMode === "Update Managers") {
        updateManager();
      } else if (answers.PickMode === "Exit") {
        process.exit();
      }
    });
};

const viewDepartments = () => {
  const query = "SELECT name FROM department";
  connection.query(query, (err, res) => {
    if (err) throw err;
    res.forEach((r) => console.log(`|| Department Name: ${r.name}||`));

    promptMode();
  });
};

const viewRoles = () => {
  const query = "SELECT * FROM role";
  connection.query(query, (err, res) => {
    if (err) throw err;
    res.forEach((r) =>
      console.log(`|| Role Title: ${r.title} || Role Salary: ${r.salary}`)
    );

    promptMode();
  });
};

const viewEmployees = () => {
  const query = "SELECT * FROM employee";
  return connection.query(query, (err, res) => {
    if (err) throw err;
    res.forEach((r) => console.log(`|| Name: ${r.first_name} ${r.last_name}`));
    promptMode();
  });
};

const addDepartment = () => {
  return inquirer
    .prompt([
      {
        name: "addDepartment",
        type: "input",
        message: "What is the department you would like to add?",
      },
    ])
    .then(function (answer) {
      connection.query(
        "INSERT INTO department SET ?",
        { name: answer.addDepartment },
        function (err) {
          if (err) throw err;
          console.log("Succesfully added new department.");
        }
      );
      promptMode();
    });
};

const addRole = () => {
  return inquirer
    .prompt([
      {
        name: "addRole",
        type: "input",
        message: "What role would you like to add?",
      },
      {
        name: "addRoleSalary",
        type: "input",
        message: "What is the roles salary?",
      },
      {
        name: "departmentNumber",
        type: "list",
        message: "Which department would you like to add it too?",
        choices: ["1.Management", "2.Development", "3.Sales", "4.Marketing"],
      },
    ])
    .then(function (answer) {
      connection.query(
        "INSERT INTO role SET ?",
        {
          title: answer.addRole,
          salary: answer.addRoleSalary || 0,
          department_id: parseInt(answer.departmentNumber),
        },
        function (err) {
          if (err) throw err;
          console.log("New Role created successfully");
        }
      );
      promptMode();
    });
};

const addEmployee = () => {
  connection.query("SELECT * FROM role", function (err, r) {
    if (err) throw err;
    return inquirer
      .prompt([
        {
          name: "roleChoice",
          type: "rawlist",
          choices: function () {
            var choiceArray = [];
            for (var i = 0; i < r.length; i++) {
              choiceArray.push(r[i].id + ". " + r[i].title);
            }
            return choiceArray;
          },
          message: "What is the new employees role?",
        },
      ])
      .then(function (answer) {
        let employeeRole = parseInt(answer.roleChoice);
        connection.query("SELECT * FROM employee", function (err, r) {
          if (err) throw err;
          return inquirer
            .prompt([
              {
                name: "employeeFirstName",
                type: "input",
                message: "What is their first name?",
              },
              {
                name: "employeeLastName",
                type: "input",
                message: "What is their last name?",
              },
            ])
            .then(function (answer2) {
              let firstName = answer2.employeeFirstName;
              let lastName = answer2.employeeLastName;
              let employeeID = r.length + 1;
              connection.query(
                "INSERT INTO employee SET ?",
                [
                  {
                    first_name: answer2.employeeFirstName,
                    last_name: answer2.employeeLastName,
                    role_id: employeeRole,
                  },
                ],
                function (err) {
                  if (err) throw err;
                  console.log("New Employee Created!");
                  promptMode();
                }
              );
            });
        });
      });
  });
};

const updateManager = () => {
  connection.query("SELECT * FROM employee WHERE manager_id IS NULL", function (
    err,
    r
  ) {
    if (err) throw err;
    return inquirer
      .prompt([
        {
          name: "findEmployee",
          type: "list",
          choices: function () {
            var choiceArray = [];
            for (var i = 0; i < r.length; i++) {
              choiceArray.push(
                r[i].id + ". " + r[i].first_name + " " + r[i].last_name
              );
            }
            return choiceArray;
          },
          message: "Please select from the employees without a manager.",
        },
      ])
      .then((r) => {
        let newEmployee = parseInt(r.findEmployee);
        connection.query("SELECT * FROM employee", (err, r) => {
          if (err) throw err;
          return inquirer
            .prompt([
              {
                name: "pickManager",
                type: "list",
                choices: function () {
                  var choiceArray = [];
                  for (var i = 0; i < r.length; i++) {
                    choiceArray.push(
                      r[i].id + ". " + r[i].first_name + " " + r[i].last_name
                    );
                  }
                  return choiceArray;
                },
                message: "Please pick the employees new manager",
              },
            ])
            .then((r2) => {
              connection.query(
                "UPDATE employee SET ? WHERE ?",
                [{ manager_id: parseInt(r2.pickManager) }, { id: newEmployee }],
                (err) => {
                  if (err) throw err;
                  console.log("Employee Updated!");
                  promptMode();
                }
              );
            });
        });
      });
  });
};

const updateEmployee = () => {
  connection.query("SELECT * FROM employee", function (err, r) {
    if (err) throw err;

    return inquirer
      .prompt([
        {
          name: "employee",
          type: "list",
          choices: function () {
            var choiceArray = [];
            for (var i = 0; i < r.length; i++) {
              choiceArray.push(r[i].id + ". " + r[i].first_name);
            }
            return choiceArray;
          },
          message: "Which employee do you wish to update?",
        },
      ])
      .then(function (answer) {
        let chosenEmployee = parseInt(answer.employee);
        connection.query("SELECT * FROM role", function (err, r) {
          if (err) throw err;
          return inquirer
            .prompt([
              {
                name: "role",
                type: "list",
                choices: function () {
                  var choiceArray = [];
                  for (var i = 0; i < r.length; i++) {
                    choiceArray.push(r[i].id + ". " + r[i].title);
                  }
                  return choiceArray;
                },
                message: "What would you like their new role to be?",
              },
            ])
            .then(function (answer2) {
              let newRole = parseInt(answer2.role);
              connection.query(
                "UPDATE employee SET ? WHERE ?",
                [{ role_id: newRole }, { id: chosenEmployee }],
                function (err) {
                  if (err) throw err;
                  console.log("Employee Updated!");
                  promptMode();
                }
              );
            });
        });
      });
  });
};