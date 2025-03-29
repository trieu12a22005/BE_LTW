import { Button, Checkbox, Form, Input, DatePicker } from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();

    const onFinish = async (values) => {
      console.log(values);
      try {
        const response = await fetch("http://localhost:3055/api/v1/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: values.username,
            fullName: values.fullname,
            email: values.email,
            password: values.password,
          }),
          credentials: "include",
        });
  
        const result = await response.json();
        if (!response.ok) {
          throw new Error(`Lỗi ${result.code}: ${result.message}`);
        }
  
        console.log(result);
        toast.success("Đăng ký thành công!");
  
        // 👉 Chỉ chuyển hướng khi đăng ký thành công
        navigate("/login");
        
      } catch (error) {
        toast.error(`Đăng ký thất bại: ${error.message}`);
      }
    };
  
  return (
    <div className="flex justify-center max-h-screen">
      <div className="flex flex-col flex-[5] justify-center px-[130px] mt-[50px] mb-[50px]">
        <h1 className="text-4xl font-bold mb-4 text-center text-[#ff3a34]">
          Sign up for UIT StudyShare
        </h1>
        <p className="text-center mb-[40px]">Enter your details below</p>
        <Form
          name="basic"
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
          style={{
            maxWidth: "100%",
            fontFamily: "Poppins",
            borderBottom: "1px solid #e5e5e5",
            marginBottom: "20px",
          }}
          initialValues={{
            remember: true,
          }}
           onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Username"
            name="username"
            style={{
              fontFamily: "Poppins",
            }}
            rules={[
              {
                required: true,
                message: "Please input your username!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Confirm password"
            name="confirmpassword"
            style={{
              fontFamily: "Poppins",
            }}
            rules={[
              {
                required: true,
                message: "Please input your confirm password!",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Full name"
            name="fullname"
            style={{
              fontFamily: "Poppins",
            }}
            rules={[
              {
                required: true,
                message: "Please input your full name!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Please input your email!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Phone number"
            name="phone"
            rules={[
              {
                required: true,
                message: "Please input your phone number!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Birthday"
            name="birthday"
            rules={[
              {
                required: true,
                message: "Please input your birthday!",
              },
            ]}
          >
            <DatePicker
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked" label={null}>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>

          <Form.Item label={null}>
            <Button
              type="primary"
              htmlType="submit"
              block
              styles={{ height: "50px", fontFamily: "Poppins" }}
            >
              Sign up
            </Button>
          </Form.Item>
        </Form>
        <div className="text-right">
          <p>
            Already have an account?{" "}
            <a href="/login" className="text-primary font-bold">
              Log in
            </a>
          </p>
        </div>
      </div>
      <div className="flex-[5]">
        <img src="image_2.png" alt="login" className="h-screen" />
      </div>
    </div>
  );
}
