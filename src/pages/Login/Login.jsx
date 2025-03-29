import React from "react";
import { Button, Checkbox, Form, Input } from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
const onFinish = async (values) => {
  try {
    const response = await fetch("http://localhost:3055/api/v1/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: values.email, // ✅ Lấy từ form
        password: values.password, // ✅ Lấy từ form
      }),
      credentials: "include",
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Lỗi ${result.code}: ${result.message}`);
    }

    if (result) {
      console.log(result)
      toast.success("Đăng nhập thành công");

    }
  } catch (error) {
    toast.error(`Đăng nhập thất bại: ${error.message}`);
  }
};

const onFinishFailed = (errorInfo) => {
  console.log("Failed:", errorInfo);
};

function Login() {
  return (
    <div className="flex h-screen">
      <div className="flex-[6]">
        <img className="h-screen w-screen object-cover" src="image_1.png" alt="Login Banner" />
      </div>
      <div className="flex flex-col flex-[4] justify-center px-[130px]">
        <h1 className="text-4xl font-bold mb-4 text-center text-[#314876]">
          Log in to UIT StudyShare
        </h1>
        <p className="text-center mb-6 text-gray-600">Enter your details below</p>
        
        <Form
          name="login-form"
          className="w-full"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Email không hợp lệ!" }
            ]}
          >
            <Input placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="Password" size="large" />
          </Form.Item>

          <div className="flex justify-between items-center mb-4">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <a href="/forgot-password" className="text-[#4096FF]">
              Forgot Password?
            </a>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Log in
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <p>
            Don&apos;t have an account?{" "}
            <a href="/register" className="font-bold text-[#4096FF]">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
