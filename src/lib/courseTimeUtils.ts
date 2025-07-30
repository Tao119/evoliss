/**
 * courseTimeから開始日時を取得する
 * @param courseTime "YYYY/MM/DD HH:mm~HH:mm" 形式の文字列
 * @returns Date オブジェクト
 */
export function getCourseStartDate(courseTime: string): Date {
  const [datePart, timePart] = courseTime.split(' ');
  const [startTime] = timePart.split('~');
  const dateStr = datePart + ' ' + startTime;
  // スラッシュをハイフンに変換してDateオブジェクトを作成
  return new Date(dateStr.replace(/\//g, '-'));
}

/**
 * 予約の開始日時を取得する（courseTimeまたはtimeSlotsから）
 * @param reservation 予約オブジェクト
 * @returns Date オブジェクト、または null
 */
export function getReservationStartDate(reservation: any): Date | null {
  if (reservation.courseTime) {
    return getCourseStartDate(reservation.courseTime);
  }
  
  if (reservation.timeSlots && reservation.timeSlots.length > 0) {
    return new Date(reservation.timeSlots[0].dateTime);
  }
  
  return null;
}

/**
 * 2つの予約を日時順でソートするための比較関数
 */
export function compareReservationsByDate(a: any, b: any): number {
  const aDate = getReservationStartDate(a);
  const bDate = getReservationStartDate(b);
  
  if (aDate && bDate) {
    return aDate.getTime() - bDate.getTime();
  }
  
  // どちらかがnullの場合
  if (aDate && !bDate) return -1;
  if (!aDate && bDate) return 1;
  
  return 0;
}
