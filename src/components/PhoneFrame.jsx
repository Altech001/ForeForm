/**
 * @param {{ children: React.ReactNode }} props
 */
export default function PhoneFrame({ children }) {
  return (
    <div className="phone-frame">
      <div className="phone-frame__notch" />
      {children}
    </div>
  );
}
