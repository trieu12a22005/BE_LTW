import React, { useState } from "react";
import { Button, Flex, Form, Input } from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
function ResetPassword(){
      const navigate = useNavigate();
      const onFinish = async (values) => {
        console.log(values.Password);
        try {
          const response = await fetch("http://localhost:3055/api/v1/users/password/reset", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // 🔥 BẮT BUỘC để trình duyệt gửi HTTP-Only Cookie
            body: JSON.stringify({
              password: values.Password, // 🔥 Đảm bảo tên key đúng
            }),
          });
      
          const result = await response.json();
      
          if (!response.ok) {
            throw new Error(`Lỗi ${result.code}: ${result.message}`);
          }
      
          if (result) {
            toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
            navigate("/login"); // 🔥 Điều hướng về trang login thay vì reset-password
          }
        } catch (error) {
          toast.error(`Đặt lại mật khẩu thất bại: ${error.message}`);
        }
      };
      
      return (
        <div className="mt-[200px] ml-[500px] mr-[500px]">
          <h1 className="mb-[50px] text-4xl font-bold text-center text-[#314876]">
            THAY ĐỔI MẬT KHẨU
          </h1>
          <Form
            name="wrap"
            labelCol={{ flex: "110px" }}
            labelAlign="left"
            labelWrap
            wrapperCol={{ flex: 1 }}
            colon={false}
            style={{ maxWidth: 600 }}
            onFinish={onFinish}
          >
            <Form.Item
              label="Nhập mật khẩu mới"
              labelCol={{ span: 7 }}
              name="Password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <div className="flex items-center gap-2 w-[290px]">
                <Input.Password
                  className="flex-1"
                />
              </div>
            </Form.Item>
            <Form.Item
              label="Nhập lại mật khẩu:"
              name="comfirmPassword"
              labelCol={{ span: 7 }}
              rules={[{ required: true }]}
            >
              <div className="flex items-center gap-2 w-[290px]">
                <Input.Password />
              </div>
            </Form.Item>
            <Form.Item label=" ">
              <Button type="primary" htmlType="submit" className="ml-[20px]">
                Xác nhận
              </Button>
            </Form.Item>
          </Form>
        </div>
      );
}
export default ResetPassword