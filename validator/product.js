const {check}=require("express-validator")

const addProductValidator=[check("name").notEmpty().withMessage("name is required"),check("price").notEmpty().withMessage("price is required").isNumeric().withMessage("price must number"),check("desc")]

module.exports={addProductValidator}